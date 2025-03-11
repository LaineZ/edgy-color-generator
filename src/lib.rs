use std::{
    cell::RefCell,
    sync::{Arc, OnceLock},
};

use edgy::{
    embedded_graphics::{
        mono_font::{ascii::FONT_6X9, MonoTextStyle},
        pixelcolor::{raw::RawU16, Rgb565, Rgb888},
        prelude::*,
        primitives::PrimitiveStyle,
        text,
    },
    margin,
    widgets::{
        grid_layout::GridLayoutBuilder,
        linear_layout::{LayoutAlignment, LayoutDirection, LinearLayoutBuilder},
        UiBuilder, WidgetObj,
    },
    SystemEvent, Theme, UiContext,
};

use embedded_graphics_web_simulator::{
    display::WebSimulatorDisplay, output_settings::OutputSettingsBuilder,
};
use log::info;
use wasm_bindgen::prelude::*;
use web_sys::{
    js_sys::{self, Reflect},
    window, Element, Event, MouseEvent,
};

pub static THEME: OnceLock<Theme<Rgb565>> = OnceLock::new();
const SCALE: u32 = 2;

fn get_current_theme() -> Theme<Rgb565> {
    let theme = THEME.get_or_init(|| Theme::hope_diamond());
    *theme
}

#[macro_export]
macro_rules! event_handler {
    ($selector:expr, $event:expr, $closure:expr) => {{
        log::info!("attached {} handle to {}", $event, $selector);

        let selector = query_selector($selector).unwrap();
        let closure = $closure;

        selector
            .add_event_listener_with_callback($event, closure.as_ref().unchecked_ref())
            .unwrap();

        closure.forget();
    }};
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Page {
    Counter,
    Bands,
}

pub struct App<'a> {
    context: UiContext<'a, WebSimulatorDisplay<Rgb565>, Rgb565>,
    counter: Arc<RefCell<usize>>,
    page: Arc<RefCell<Page>>,
}

impl<'a> App<'a> {
    pub fn new(selector: Option<Element>) -> Self {
        let output_settings = OutputSettingsBuilder::new()
            .scale(SCALE)
            .pixel_spacing(0)
            .build();

        let display = Box::leak(Box::new(WebSimulatorDisplay::<Rgb565>::new(
            (170, 128),
            &output_settings,
            selector.as_ref(),
        )));

        Self {
            context: UiContext::new(display, get_current_theme()),
            counter: Arc::new(RefCell::new(0)),
            page: Arc::new(RefCell::new(Page::Counter)),
        }
    }

    pub fn setup(&mut self) {}

    fn counter(&mut self) -> WidgetObj<'a, WebSimulatorDisplay<Rgb565>, Rgb565> {
        let mut layout_builder = LinearLayoutBuilder::default()
            .horizontal_alignment(LayoutAlignment::Center)
            .vertical_alignment(LayoutAlignment::Center);
        let style = MonoTextStyle::new(&FONT_6X9, self.context.theme.foreground);
        let counter = self.counter.clone();

        layout_builder.label(
            format!("Counter {}", counter.borrow()),
            text::Alignment::Center,
            style,
        );

        layout_builder.margin_layout(margin!(5), |ui| {
            ui.button("Increase", &FONT_6X9, move || {
                *counter.borrow_mut() += 1;
            });
        });

        let counter = self.counter.clone();
        layout_builder.margin_layout(margin!(5), |ui| {
            ui.button("Decrease", &FONT_6X9, move || {
                *counter.borrow_mut() -= 1;
            });
        });

        layout_builder.finish()
    }

    fn bands(&mut self) -> WidgetObj<'a, WebSimulatorDisplay<Rgb565>, Rgb565> {
        let mut layout_builder = LinearLayoutBuilder::default()
            .direction(LayoutDirection::Horizontal)
            .horizontal_alignment(LayoutAlignment::Stretch)
            .vertical_alignment(LayoutAlignment::Stretch);
        let style = MonoTextStyle::new(&FONT_6X9, self.context.theme.foreground);

        layout_builder.margin_layout_styled(
            margin!(0),
            PrimitiveStyle::with_fill(self.context.theme.background),
            |ui| {
                ui.label("fg", text::Alignment::Left, style);
            },
        );

        layout_builder.margin_layout_styled(
            margin!(0),
            PrimitiveStyle::with_fill(self.context.theme.background2),
            |ui| {
                ui.label("fg", text::Alignment::Left, style);
            },
        );

        layout_builder.margin_layout_styled(
            margin!(0),
            PrimitiveStyle::with_fill(self.context.theme.background3),
            |ui| {
                ui.label("fg", text::Alignment::Left, style);
            },
        );

        let style = MonoTextStyle::new(&FONT_6X9, self.context.theme.foreground2);

        layout_builder.margin_layout_styled(
            margin!(0),
            PrimitiveStyle::with_fill(self.context.theme.background),
            |ui| {
                ui.label("fg2", text::Alignment::Left, style);
            },
        );

        layout_builder.margin_layout_styled(
            margin!(0),
            PrimitiveStyle::with_fill(self.context.theme.background2),
            |ui| {
                ui.label("fg2", text::Alignment::Left, style);
            },
        );

        layout_builder.margin_layout_styled(
            margin!(0),
            PrimitiveStyle::with_fill(self.context.theme.background3),
            |ui| {
                ui.label("fg2", text::Alignment::Left, style);
            },
        );

        let style = MonoTextStyle::new(&FONT_6X9, self.context.theme.foreground3);

        layout_builder.margin_layout_styled(
            margin!(0),
            PrimitiveStyle::with_fill(self.context.theme.background),
            |ui| {
                ui.label("fg3", text::Alignment::Left, style);
            },
        );

        layout_builder.margin_layout_styled(
            margin!(0),
            PrimitiveStyle::with_fill(self.context.theme.background2),
            |ui| {
                ui.label("fg3", text::Alignment::Left, style);
            },
        );

        layout_builder.margin_layout_styled(
            margin!(0),
            PrimitiveStyle::with_fill(self.context.theme.background3),
            |ui| {
                ui.label("fg3", text::Alignment::Left, style);
            },
        );

        layout_builder.finish()
    }

    pub fn update(&mut self) {
        let mut grid = GridLayoutBuilder::default()
            .add_column(100)
            .add_row(80)
            .add_row(20);

        let page = self.page.clone();
        let page_value = *self.page.borrow();

        let layout = match page_value {
            Page::Counter => self.counter(),
            Page::Bands => self.bands(),
        };

        grid.add_widget_obj(layout);

        grid.horizontal_linear_layout(LayoutAlignment::Stretch, move |ui| {
            let page = page.clone();
            let page2 = page.clone();

            ui.toggle_button(
                "COUNTER",
                &FONT_6X9,
                page_value == Page::Counter,
                move |_| {
                    *page.borrow_mut() = Page::Counter;
                },
            );

            ui.toggle_button("BANDS", &FONT_6X9, page_value == Page::Bands, move |_| {
                *page2.borrow_mut() = Page::Bands;
            });
        });

        self.context.draw_target.clear(Rgb565::BLACK).unwrap();
        self.context.update(&mut grid.finish());
        self.context.draw_target.flush().expect("Couldn't update");
    }

    pub fn input(&mut self, event: SystemEvent) {
        self.context.push_event(event);
    }
}

fn request_animation_frame(f: &Closure<dyn FnMut()>) {
    window()
        .unwrap()
        .request_animation_frame(f.as_ref().unchecked_ref())
        .expect("should register `requestAnimationFrame` OK");
}

fn query_selector(selector: &str) -> Option<Element> {
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");
    document.query_selector(selector).unwrap()
}

#[wasm_bindgen]
pub fn rgb565_to_rgb888(value: u16) -> u32 {
    let rgb565: Rgb565 = RawU16::new(value).into();
    let rgb888: Rgb888 = rgb565.into();

    rgb888.into_storage()
}

#[wasm_bindgen]
pub fn get_theme_colors() -> JsValue {
    let obj = js_sys::Object::new();
    let theme = get_current_theme();

    Reflect::set(
        &obj,
        &JsValue::from_str("background"),
        &JsValue::from(theme.background.into_storage()),
    )
    .unwrap();
    Reflect::set(
        &obj,
        &JsValue::from_str("background2"),
        &JsValue::from(theme.background2.into_storage()),
    )
    .unwrap();
    Reflect::set(
        &obj,
        &JsValue::from_str("background3"),
        &JsValue::from(theme.background3.into_storage()),
    )
    .unwrap();
    Reflect::set(
        &obj,
        &JsValue::from_str("foreground"),
        &JsValue::from(theme.foreground.into_storage()),
    )
    .unwrap();
    Reflect::set(
        &obj,
        &JsValue::from_str("foreground2"),
        &JsValue::from(theme.foreground2.into_storage()),
    )
    .unwrap();
    Reflect::set(
        &obj,
        &JsValue::from_str("foreground3"),
        &JsValue::from(theme.foreground3.into_storage()),
    )
    .unwrap();

    obj.into()
}

// This is like the `main` function, except for JavaScript.
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    wasm_logger::init(wasm_logger::Config::new(log::Level::Debug));
    console_error_panic_hook::set_once();

    let app = Arc::new(RefCell::new(App::new(query_selector(".simulator-window"))));
    app.borrow_mut().setup();

    let app_clone = app.clone();

    event_handler!(
        ".simulator-window canvas",
        "click",
        Closure::<dyn FnMut(web_sys::MouseEvent)>::new(move |event: MouseEvent| {
            let selector = query_selector(".simulator-window canvas").unwrap();
            let rect = selector.get_bounding_client_rect();

            let offset_x = event.client_x() - rect.left() as i32;
            let offset_y = event.client_y() - rect.top() as i32;

            let pos = Point::new(offset_x, offset_y);

            app_clone
                .borrow_mut()
                .input(SystemEvent::Active(pos / SCALE as i32));
        })
    );

    let app_clone = app.clone();
    event_handler!(
        ".simulator-window canvas",
        "mousemove",
        Closure::<dyn FnMut(web_sys::MouseEvent)>::new(move |event: MouseEvent| {
            let selector = query_selector(".simulator-window canvas").unwrap();
            let rect = selector.get_bounding_client_rect();

            let offset_x = event.client_x() - rect.left() as i32;
            let offset_y = event.client_y() - rect.top() as i32;

            let pos = Point::new(offset_x, offset_y) / SCALE as i32;

            //log::info!("{pos}");

            app_clone.borrow_mut().input(SystemEvent::Move(pos));
        })
    );

    let app_clone = app.clone();
    event_handler!(
        "#debug-toggle",
        "click",
        Closure::<dyn FnMut(web_sys::MouseEvent)>::new(move |_event: MouseEvent| {
            let mut borrow = app_clone.borrow_mut();
            borrow.context.debug_mode = !borrow.context.debug_mode;
        })
    );

    let app_clone = app.clone();
    event_handler!(
        "body",
        "colorChange",
        Closure::<dyn FnMut(web_sys::Event)>::new(move |event: Event| {
            if let Some(custom_event) = event.dyn_ref::<web_sys::CustomEvent>() {
                let detail = js_sys::Object::from(custom_event.detail());

                let key = js_sys::Reflect::get(&detail, &"key".into())
                    .unwrap()
                    .as_string()
                    .unwrap_or_default();

                let value = js_sys::Reflect::get(&detail, &"value".into())
                    .unwrap()
                    .as_f64()
                    .unwrap_or_default();

                let mut borrow = app_clone.borrow_mut();

                match key.as_str() {
                    "background" => {
                        borrow.context.theme.background = RawU16::new(value as u16).into();
                    }
                    "background2" => {
                        borrow.context.theme.background2 = RawU16::new(value as u16).into();
                    }
                    "background3" => {
                        borrow.context.theme.background3 = RawU16::new(value as u16).into();
                    }
                    "foreground1" => {
                        borrow.context.theme.foreground = RawU16::new(value as u16).into();
                    }
                    "foreground2" => {
                        borrow.context.theme.foreground2 = RawU16::new(value as u16).into();
                    }
                    "foreground3" => {
                        borrow.context.theme.foreground3 = RawU16::new(value as u16).into();
                    }
                    _ => {
                        log::warn!("Unknown key for theme {}", key);
                    }
                }
            }
        })
    );

    let f = Arc::new(RefCell::new(None));
    let g = f.clone();

    let app_clone = app.clone();
    *g.borrow_mut() = Some(Closure::new(move || {
        app_clone.borrow_mut().update();
        request_animation_frame(f.borrow().as_ref().unwrap());
    }));

    request_animation_frame(g.borrow().as_ref().unwrap());
    Ok(())
}
