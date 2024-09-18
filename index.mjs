import {canvas, ctx} from "./canvas.mjs"


let currentScroll = 0
const margin = 40
const elementHeight = 200
const elementDistance = 40
const period = elementHeight + elementDistance

let velocity = 0
let resistance = 0.002

let lastTime
function renderLoop(currentTime){
    if(!lastTime){
        lastTime = currentTime
    }
    const acc = resistance * Math.sign(velocity)
    const dt = Math.min(currentTime - lastTime, Math.abs(velocity) / resistance)
    lastTime = currentTime

    const ds = velocity * dt - acc * dt ** 2 / 2
    checkBuzz(ds)
    currentScroll += ds
    velocity = velocity - acc * dt
    draw()

    if(currentScroll < 0){
        currentScroll = 0
        velocity = 0
    }

    if(velocity !== 0) {
        requestAnimationFrame(renderLoop)
    }else{
        lastTime = undefined
    }
}

const offset = innerHeight

requestAnimationFrame(renderLoop)

function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(canvas.width / innerWidth, canvas.height / innerHeight)
    ctx.translate(0, -currentScroll)

    const size = 100
    const a = (3/4 - 1/3)*2*Math.PI
    const b = (3/4)*2*Math.PI
    const c = (3/4 + 1/3)*2*Math.PI
    ctx.beginPath()
    ctx.moveTo(innerWidth / 2, offset / 2 - size*Math.sin((3/4 - 1/3)*2*Math.PI))
    ctx.arcTo(
        innerWidth / 2 + size*Math.cos(a),
        offset / 2 - size*Math.sin(a),
        innerWidth / 2 + size*Math.cos(b),
        offset / 2 - size*Math.sin(b),
        10,
    )
    ctx.arcTo(
        innerWidth / 2 + size*Math.cos(b),
        offset / 2 - size*Math.sin(b),
        innerWidth / 2 + size*Math.cos(c),
        offset / 2 - size*Math.sin(c),
        10,
    )
    ctx.arcTo(
        innerWidth / 2 + size*Math.cos(c),
        offset / 2 - size*Math.sin(c),
        innerWidth / 2 + size*Math.cos(a),
        offset / 2 - size*Math.sin(a),
        10,
    )
    ctx.closePath()
    ctx.fillStyle = "lightgray"
    ctx.shadowColor = "darkgray"
    ctx.shadowOffsetX = 5
    ctx.shadowOffsetY = 5
    ctx.shadowBlur = 5
    ctx.fill()

    ctx.translate(0, offset)
    for(
        let i = Math.max(0, Math.floor((currentScroll - offset) / period));
        i < Math.ceil(((currentScroll - offset) + innerHeight) / period);
        i += 1
    ){
        ctx.beginPath()
        ctx.roundRect(
            margin, i * period,
            innerWidth - 2 * margin, elementHeight,
            10,
        )

        if(i % 1000 === 999){
            const gradient = ctx.createLinearGradient(
                margin, i * period, innerWidth - margin, i * period + elementHeight
            )
            gradient.addColorStop(0, "rgb(240, 220, 20)")
            gradient.addColorStop(1, "rgb(120, 100, 10)")
            ctx.fillStyle = gradient
        }else {
            ctx.fillStyle = "lightgray"
        }
        ctx.shadowColor = "darkgray"
        ctx.shadowOffsetX = 5
        ctx.shadowOffsetY = 5
        ctx.shadowBlur = 5
        ctx.fill()
    }
    ctx.restore()
}

function checkBuzz(ds){
    if(
        currentScroll - offset + ds > Math.ceil((currentScroll - offset) / period) * period ||
        currentScroll - offset - elementHeight + ds < Math.floor((currentScroll - offset - elementHeight) / period) * period && currentScroll > offset
    ){
        if(navigator.userActivation.hasBeenActive) {
            navigator.vibrate(10)
            console.log("buzz")
        }
    }
}

draw()
addEventListener("resize", _ => {
    draw()
})
addEventListener("wheel", e => {
    checkBuzz(e.deltaY)
    currentScroll += e.deltaY
    currentScroll = Math.max(0, currentScroll)
    draw()
})

class TouchPos {
    t
    x
    y
    constructor(t, x, y) {
        this.t = t
        this.x = x
        this.y = y
    }
}

const touches = new Map()

addEventListener("touchstart", e => {
    velocity = 0
    for(const touch of e.changedTouches){
        touches.set(touch.identifier, [new TouchPos(e.timeStamp, touch.clientX, touch.clientY)])
    }
})
addEventListener("touchmove", e => {
    for(const touch of e.changedTouches){
        const history = touches.get(touch.identifier)
        const ds = -(touch.clientY - history[history.length - 1].y) / e.touches.length
        checkBuzz(ds)
        currentScroll += ds
        currentScroll = Math.max(0, currentScroll)
        history.push(new TouchPos(e.timeStamp, touch.clientX, touch.clientY))
    }
    draw()
})

const timeConsidered = 1000
const maxLen = 10
const buttonSize = 200
addEventListener("touchend", e => {
    for(const touch of e.changedTouches){
        if(e.touches.length === 0){
            const history = touches.get(touch.identifier)
            let len = 0
            for(let i = 0; i < history.length - 1; i++){
                len += Math.hypot(history[i + 1].x - history[i].x, history[i + 1].y - history[i].y)
            }
            if(len < maxLen && Math.hypot(touch.clientX - innerWidth / 2, touch.clientY + currentScroll - offset / 2) < buttonSize){
                const ds = offset - elementDistance - currentScroll
                velocity = Math.sqrt(ds * 2 * resistance)
            }else {
                if (history[0].t <= e.timeStamp - timeConsidered) {
                    let i = history.length - 1
                    while (history[i].t > e.timeStamp - timeConsidered) {
                        i--
                    }
                    const t = (e.timeStamp - timeConsidered - history[i].t) / (history[i + 1].t - history[i].t)
                    const y = history[i].y + (history[i + 1].y - history[i].y) * t
                    const dy = touch.clientY - y
                    velocity = -dy / timeConsidered
                } else {
                    velocity = -(touch.clientY - history[0].y) / (e.timeStamp - history[0].t)
                }
            }

            requestAnimationFrame(renderLoop)
        }
    }
})