const concat = require("ffmpeg-concat");

module.exports = (job, settings, { input, video, output }) => {
  return new Promise((resolve, reject) => {
    input = input || job.output;
    output = output || "mergedVideo.mp4";

    if (input.indexOf("http") !== 0 && !path.isAbsolute(input)) {
      input = path.join(job.workpath, input);
    }
    if (video.indexOf("http") !== 0 && !path.isAbsolute(video)) {
      video = path.join(job.workpath, video);
    }
    if (output.indexOf("http") !== 0 && !path.isAbsolute(output)) {
      output = path.join(job.workpath, output);
    }

    settings.logger.log(
      `[${job.uid}] starting action-mergeVideos on [${input}] `
    );

    concat({
      output,
      videos: [video, input],
      transition: {
        name: "directionalWipe",
        duration: 300,
      },
    })
      .then((result) => {
        console.log(result);
        job.output = output;
        resolve(output);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
};
