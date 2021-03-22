const ffmpeg = require("fluent-ffmpeg");
const fetch = require("node-fetch");
const nfp = require("node-fetch-progress");
const fs = require("fs");
const path = require("path");
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');

const getBinary = (job, settings) => {
  return new Promise((resolve, reject) => {
    const version = "b4.2.2";
    const filename = `ffmpeg-${version}${process.platform == "win32" ? ".exe" : ""
      }`;
    const fileurl = `https://github.com/eugeneware/ffmpeg-static/releases/download/${version}/${process.platform}-x64`;
    const output = path.join(settings.workpath, filename);

    if (fs.existsSync(output)) {
      settings.logger.log(
        `> using an existing ffmpeg binary ${version} at: ${output}`
      );
      return resolve(output);
    }

    settings.logger.log(`> ffmpeg binary ${version} is not found`);
    settings.logger.log(
      `> downloading a new ffmpeg binary ${version} to: ${output}`
    );

    const errorHandler = (error) =>
      reject(
        new Error({
          reason: "Unable to download file",
          meta: { fileurl, error },
        })
      );

    fetch(fileurl)
      .then((res) =>
        res.ok
          ? res
          : Promise.reject({
            reason: "Initial error downloading file",
            meta: { fileurl, error: res.error },
          })
      )
      .then((res) => {
        const progress = new nfp(res);

        progress.on("progress", (p) => {
          process.stdout.write(
            `${Math.floor(p.progress * 100)}% - ${p.doneh}/${p.totalh} - ${p.rateh
            } - ${p.etah}                       \r`
          );
        });

        const stream = fs.createWriteStream(output);

        res.body.on("error", errorHandler).pipe(stream);

        stream.on("error", errorHandler).on("finish", () => {
          settings.logger.log(
            `> ffmpeg binary ${version} was successfully downloaded`
          );
          fs.chmodSync(output, 0o755);
          resolve(output);
        });
      });
  });
};


module.exports = (job, settings, { input, input2, output, onStart, onComplete }) => {
  onStart()
  let started = Date.now()
  return new Promise((resolve, reject) => {
    input = input || job.output;
    output = output || "mergedVideo.mp4";

    if (input.indexOf("http") !== 0 && !path.isAbsolute(input)) {
      input = path.join(job.workpath, input);
    }
    if (input2.indexOf("http") !== 0 && !path.isAbsolute(input2)) {
      input2 = path.join(job.workpath, input2);
    }
    if (output.indexOf("http") !== 0 && !path.isAbsolute(output)) {
      output = path.join(job.workpath, output);
    }
    settings.logger.log(
      `[${job.uid}] starting buzzle-action-merge-videos on [${input}] `
    );
    getBinary(job, settings).then(async (p) => {
      ffmpeg.setFfmpegPath(p);
      const videoDetails = (await ffprobe(input, { path: ffprobeStatic.path })).streams.find(({ codec_type }) => codec_type === 'video')
      const openingVideo = (await ffprobe(input2, { path: ffprobeStatic.path })).streams.find((({ codec_type }) => codec_type === 'video'))
      if (videoDetails.width === openingVideo.width && videoDetails.height === openingVideo.height) {
        // run ffmpeg directly
        ffmpeg()
          .input(input2)
          .input(input)
          .outputOptions([`-r ${videoDetails.r_frame_rate || 24}`])
          .complexFilter('concat=n=2:v=1:a=1')
          .on("error", function (err, stdout, stderr) {
            settings.logger.log("merging video failed: " + err.message);
            settings.logger.log("merge video stderr: " + stderr);
            onComplete()
            reject(err);
          })
          .on("progress", function (value) {
            console.log("In Progress..");
          })
          .on("end", function () {
            onComplete()
            job.output = output;
            settings.logger.log(
              `[${job.uid}] Finished buzzle-action-merge-videos on [${input}] in ${(Date.now() - started) / 1000} secs `
            );
            resolve(job);
          })
          .save(output);
      } else {
        onComplete()
        settings.logger.log(
          `[${job.uid}] Exiting buzzle-action-merge-videos on [${input}] because of mismatch dimensions, took ${(Date.now() - started) / 1000} secs `
        );
        resolve(job);
      }
    }).catch(e => settings.logger.log(e.message))
  });
};
