const concat = require("ffmpeg-concat");
const path = require('path');

module.exports = (job, settings, { input, input2, output, onStart, onComplete }) => {
  onStart()
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
      `[${job.uid}] starting action-mergeVideos on [${input}] `
    );

    concat({
      output,
      videos: [input2, input],
      transition: {
        name: "directionalWipe",
        duration: 300,
      },
    })
      .then((result) => {
        console.log(result);
        job.output = output;
        onComplete()
        resolve(output);
      })
      .catch((err) => {
        console.log(err);
        onComplete()
        reject(err);
      });
  });
};
