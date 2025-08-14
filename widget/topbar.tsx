import { Gtk, Gdk } from "ags/gtk4";
import GLib from "gi://GLib"
import { createPoll } from "ags/time"
import { For, createBinding, createComputed, onCleanup } from "ags"
import Astal from "gi://Astal?version=4.0"
import AstalHyprland from "gi://AstalHyprland"
import AstalTray from "gi://AstalTray"
import AstalBattery from "gi://AstalBattery?version=0.1";
const hypr = AstalHyprland.get_default()

function DistroLogo() {
  return (
    <Gtk.Button class="distrologo" >
      <Gtk.Image icon-name={GLib.get_os_info("LOGO") || "missing-symbolic"} />
    </Gtk.Button>
  )
}

function Workspaces({ monitor }: {monitor: Gdk.Monitor}) {
  const workspaces = createBinding(hypr, "workspaces").as((w) =>
    w.filter((wss: AstalHyprland.Workspace) => wss.monitor?.name === monitor.connector && !(wss.id >= -99 && wss.id <= -2)).
    sort((a: AstalHyprland.Workspace, b: AstalHyprland.Workspace) => a.id - b.id)
  ); 

  const focused = createBinding(hypr, "focusedWorkspace")

  return (
    <Gtk.Box class={"workspaces"}>
      <For each={workspaces}>
        {(w: AstalHyprland.Workspace, idx) => {
          const clients = createBinding(w, 'clients')

          const cls = createComputed(
            [focused, clients],
            (fId, cl): string => {
              const focused = fId?.id === w.id;
              const occupied = cl.length > 0;
              return `${focused ? 'focused ' : ''}${occupied ? 'occupied' : ''}`.trim();
            },
          );

          return (
            <Gtk.Button
              class={cls}
              cursor={Gdk.Cursor.new_from_name("pointer", null)}
              onClicked={() => w.focus?.()}
              label={idx(id => String(id + 1))}>
            </Gtk.Button>
          )
        }}
      </For>
    </Gtk.Box>
  )
}

function DateTime() {
  const poll = createPoll("", 5000, () => GLib.DateTime.new_now_local().format("%a %d %B ‧ %H:%M")!)
  
  return (
    <Gtk.Button
      class={"datetime"}
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
      label={poll}
    />
  )
}

function Battery() {
  const bat = AstalBattery.get_default()
  const percentage = createBinding(bat, "percentage")

  if (bat === null ) { return }

  return (
    <Gtk.Box class={"battery"}>
      <Gtk.LevelBar

      />
      <Gtk.Label
        label={percentage.as(p => `${Math.round(p * 100)}%`)}
        visible={percentage.as(p => (p ?? 0) < 0.30)}
      />
    </Gtk.Box>
  )
}

function Tray() {
  const tray = AstalTray.get_default()
  const items = createBinding(tray, "items")

  return (
    <Gtk.Box class="systray" visible={items.as((item) => item.length > 0 )}>
      <For each={items}>
        {item => {
          const pop = Gtk.PopoverMenu.new_from_model(item.menuModel)
          pop.set_has_arrow(false)

          const conns = [
            item.connect("notify::menu-model", () => pop.set_menu_model(item.menuModel)),
            item.connect("notify::action-group", () => pop.insert_action_group("dbusmenu", item.actionGroup)),
          ];

          onCleanup(() => { conns.map((id) => item.disconnect(id)) })

          return (
            <Gtk.Box homogeneous={true} $={(self) => { pop.set_parent(self) }}>
              <Gtk.Image gicon={createBinding(item, 'gicon')}/>
              <Gtk.GestureClick exclusive={true} button={Gdk.BUTTON_SECONDARY} onPressed={() => pop.popup?.()} />
            </Gtk.Box>
          )
        }}
      </For>
    </Gtk.Box>
  );
}

export default function Topbar({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  return <window
    visible
    name={"topbar"}
    class={"topbar"}
    gdkmonitor={gdkmonitor}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}>
    <Gtk.CenterBox>
      <Gtk.Box $type="start">
        <DistroLogo/>
        <Workspaces monitor={gdkmonitor} />
      </Gtk.Box>
      <Gtk.Box $type="center">
        <DateTime/>
      </Gtk.Box>
      <Gtk.Box $type="end">
        <Tray/>
      </Gtk.Box>
    </Gtk.CenterBox>
  </window>
}
