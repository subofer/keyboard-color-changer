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
        mute: _settings.get_string('dinamic-mute'),
        unMute: _settings.get_string('dinamic-unmute'),
      },
      static: {
        mute: _settings.get_string('static-mute'),
        unMute: _settings.get_string('static-unmute'),
      },
      defaultColor: _settings.get_string('default-color'),
    },
  });
  
  const getCurrentVolume = () => {
    const match = GLib.spawn_command_line_sync('pactl list sinks')[1].toString().match(/[0-9]{1,3}[%]/mid)[0];
     return match ? parseInt(match)/100 : null;
  };
  
  const changeKeyboardColor = (newValue, pattern) => {
    const { enabled, defaultColor, effects: { [pattern]: { mute, unMute } } } = settings();
    if (!enabled) return setKeyboardEffect(defaultColor);
    
    const effect = newValue ? unMute : mute;
    if (lastEffect !== effect) setKeyboardEffect(effect);
  }

  const setInitialKeyboardColor = () => changeKeyboardColor(getCurrentVolume(), 'static');
  
  const setKeyboardEffect = (effect) => {
    Gio.Subprocess.new([settings().polychromaticPath, '-e', effect], null);
    lastEffect = effect?.replace('static-', '') || effect;
  }

  let settingsId = _settings.connect('changed::keyboard-options-enabled', setInitialKeyboardColor);
  let valueChangedId = slider.connect('notify::value', ({ _value:v }) => changeKeyboardColor(v, 'dinamic'));
  
  setInitialKeyboardColor();

  return () => {
    setKeyboardEffect(settings().defaultColor);
    slider.disconnect(valueChangedId);
    _settings.disconnect(settingsId);
  }
}

function init() {
  extensionUtils.initTranslations();
  let patches = [];

  return {
    enable:() => patches = Osd.map(createSliderNumberPatch),
    disable:() => patches = !!patches.forEach(w => w()) || [],
  };
};
