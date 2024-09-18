const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const resolution = 1
function resize(){
    canvas.width = innerWidth * devicePixelRatio * resolution
    canvas.height = innerHeight * devicePixelRatio * resolution
}
resize()
addEventListener("resize", resize)

export {canvas, ctx}