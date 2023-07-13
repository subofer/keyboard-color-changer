const { 
  gi: { Gio, GLib },
  misc: { extensionUtils },
  ui: { main: { osdWindowManager: { _osdWindows: Osd } } } 
} = imports;

const Me = extensionUtils.getCurrentExtension();

const createSliderNumberPatch = ({ _level: slider }) => {
  let lastEffect = null;
  
  const _settings = extensionUtils.getSettings();
  const settings = () => ({
    enabled: _settings.get_boolean('keyboard-options-enabled'),
    polychromaticPath: _settings.get_string('polychromatic-path'),
    effects: {
      dinamic: {
        false: _settings.get_string('dinamic-mute'),
        true: _settings.get_string('dinamic-unmute'),
      },
      static: {
        false: _settings.get_string('static-mute'),
        true: _settings.get_string('static-unmute'),
      },
      defaultColor: _settings.get_string('default-color'),
    },
  });
  
  
  const getCurrentVolume = () => parseInt(GLib.spawn_command_line_sync('pactl list sinks')[1].toString().match(/[0-9]{1,3}[%]/mid)[0])/100;
  
  const defautlKeyboardColor = () => setKeyboardEffect(settings().effects.defaultColor);
  
  const changeKeyboardColor = (v, p) => {
    const { enabled, effects } = settings();
    if (!enabled) return defautlKeyboardColor();
    if (lastEffect !== effects[p][!!v]) setKeyboardEffect(effects[p][!!v]);
  }

  const setKeyboardEffect = (effect) => {
    Gio.Subprocess.new([settings().polychromaticPath, '-e', effect], null);
    lastEffect = effect?.replace('static-', '') || effect;
  }

  let settingsId = _settings.connect('changed::keyboard-options-enabled', () => changeKeyboardColor(getCurrentVolume(), 'static'));
  let valueChangedId = slider.connect('notify::value', ({ _value }) => changeKeyboardColor(_value, 'dinamic'));
  
  changeKeyboardColor(getCurrentVolume(), 'static');

  return () => {
    defautlKeyboardColor()
    slider.disconnect(valueChangedId);
    _settings.disconnect(settingsId);
  }
}

function init() {
  extensionUtils.initTranslations();
  let patches = [];

  return {
    enable:() => patches = Osd.map(createSliderNumberPatch),
    disable:() => { patches.forEach((unpatch) => unpatch()); patches = [] },
  };
};
