import app from "ags/gtk4/app"
import style from "./style/main.scss"
import Topbar from "./widget/topbar"
import { execAsync } from "ags/process"
import { monitorFile } from "ags/file"
import { Gtk, Gdk } from "ags/gtk4";
import { For, createBinding } from "ags"

(async () => {
  const pathsToMonitor = [`${SRC}/style` ]
  const mainScss = `${SRC}/style/main.scss` // SCSS input file to compile
  const css = `/tmp/style.css` // CSS output file

  let isApplying = false

  async function transpileAndApply() {
    if (isApplying) return
    isApplying = true

    try {
      await execAsync(`sass ${mainScss} ${css}`)
      app.apply_css(css, true)
      print("CSS applied successfully!")
    } catch (error) {
      print("Error transpiling SCSS:", error)
      execAsync(`notify-send -u critical "Error transpiling SCSS" "${error}"`)
    } finally {
      isApplying = false
    }
  }

  pathsToMonitor.forEach((path) => monitorFile(path, transpileAndApply))

  return transpileAndApply()
})()

const monitors = createBinding(app, "monitors")

function main() {
  return (
    <For each={monitors} cleanup={(win: Gtk.Window) => (win as Gtk.Window).destroy()}>
      {(monitor: Gdk.Monitor) => (
        <Topbar gdkmonitor={monitor}/>
      )}
    </For>
  )
}

app.start({ css: style, main })
