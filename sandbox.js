const mergedVideo = require("./index")
const output = "mergedVideo.mp4";
let input = 'ganesh_opening_new(960x540).mp4'
const input2 = 'rendered.mp4'
let started = Date.now()
mergedVideo(
  { output: "C:\\Users\\Utkarsh\\Desktop", workpath: "C:\\Users\\Utkarsh\\Desktop" }, {
  logger: { log: console.log },
  workpath: "C:\\Users\\Utkarsh\\Desktop"
}, {
  input, input2, output,
  onStart: () => {
    console.log("Started")
    started = Date.now()
  },
  onComplete: () => console.log("completed in", (Date.now() - started) / 1000, " secs")
}).catch((e) => console.log("Something went wrong! ", e.message))
