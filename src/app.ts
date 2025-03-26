import "./css/app.css"

import { Application } from "@hotwired/stimulus"
import { TransitionController, ClickOutsideController } from "stimulus-use"
import MenuController from "./js/controllers/menu_controller"
import SelectController from "./js/controllers/select_controller"
import ModeSwitchController from "./js/controllers/mode_switch_controller"
import FlyoverController from "./js/controllers/flyover_controller"
import TabsController from "./js/controllers/tabs_controller"
import ClipboardController from "./js/controllers/clipboard_controller"
import CollapsibleController from "./js/controllers/collapsible_controller"
import AutocolumnsController from "./js/controllers/autocolumns_controller"
import SearchController from "./js/controllers/search_controller"

const application = Application.start()
application.register("clipboard", ClipboardController)
application.register("transition", TransitionController)
application.register("click-outside", ClickOutsideController)
application.register("menu", MenuController)
application.register("select", SelectController)
application.register("mode-switch", ModeSwitchController)
application.register("flyover", FlyoverController)
application.register("tabs", TabsController)
application.register("collapsible", CollapsibleController)
application.register("autocolumns", AutocolumnsController)
application.register("search", SearchController)