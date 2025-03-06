use std::{
    cell::{OnceCell, RefCell},
    sync::Arc,
};

use edgy::{
    embedded_graphics::{
        mono_font::{ascii::FONT_6X9, MonoTextStyle},
        pixelcolor::Rgb565,
        prelude::*,
        text,
    },
    widgets::{
        linear_layout::{LayoutAlignment, LinearLayoutBuilder},
        UiBuilder,
    },
    SystemEvent, Theme, UiContext,
};
use embedded_graphics_web_simulator::{
    display::WebSimulatorDisplay, output_settings::OutputSettingsBuilder,
};
use wasm_bindgen::prelude::*;
use web_sys::{window, Element, HtmlElement, HtmlInputElement, MouseEvent, Window};

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

pub struct App<'a> {
    context: UiContext<'a, WebSimulatorDisplay<Rgb565>, Rgb565>,
    counter: Arc<RefCell<usize>>,
}

impl<'a> App<'a> {
    pub fn new(selector: Option<Element>) -> Self {
        let output_settings = OutputSettingsBuilder::new()
            .scale(SCALE)
            .pixel_spacing(0)
            .build();

        let display = Box::leak(Box::new(WebSimulatorDisplay::<Rgb565>::new(
            (160, 128),
            &output_settings,
            selector.as_ref(),
        )));

        Self {
            context: UiContext::new(display, Theme::hope_diamond()),
            counter: Arc::new(RefCell::new(0)),
        }
    }

    pub fn setup(&mut self) {}

    pub fn update(&mut self) {
        let counter = self.counter.clone();

        let style = MonoTextStyle::new(&FONT_6X9, Rgb565::WHITE);
        let mut govno = {
            let mut layout_builder = LinearLayoutBuilder::default()
                .horizontal_alignment(LayoutAlignment::Center)
                .vertical_alignment(LayoutAlignment::Center);

            layout_builder.label(
                format!("Counter {}", counter.borrow()),
                text::Alignment::Center,
                style,
            );
            layout_builder.button("Increase", &FONT_6X9, move || {
                *counter.borrow_mut() += 1;
            });

            let counter = self.counter.clone();
            layout_builder.button("Descrease", &FONT_6X9, move || {
                *counter.borrow_mut() -= 1;
            });

            layout_builder.finish()
        };

        self.context.draw_target.clear(Rgb565::BLACK).unwrap();
        self.context.update(&mut govno);
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

const SCALE: u32 = 2;

fn query_selector(selector: &str) -> Option<Element> {
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");
    document.query_selector(selector).unwrap()
}

// This is like the `main` function, except for JavaScript.
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    wasm_logger::init(wasm_logger::Config::new(log::Level::Debug));
    console_error_panic_hook::set_once();

    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");

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
        "#background_color_input",
        "change",
        Closure::<dyn FnMut(web_sys::MouseEvent)>::new(move |_event| {
            let selector = query_selector("#background_color_input").unwrap();
            let node_value = selector.dyn_into::<HtmlInputElement>().unwrap().value();
            let hex = &node_value[1..];

            let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
            let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
            let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);

            log::info!("{r} {g} {b} {hex}");

            app_clone.borrow_mut().context.theme.background = Rgb565::new(r, g, b);
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

            log::info!("{pos}");

            app_clone.borrow_mut().input(SystemEvent::Move(pos));
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
