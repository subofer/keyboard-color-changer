const { 
  misc: { extensionUtils: ExUtils },
  gi: { Gio: { Subprocess : { new: Polychromatic } }, GLib: { spawn_command_line_sync: run } },
  ui: { main: { osdWindowManager: { _osdWindows: Osd } } },
} = imports;

const Me = ExUtils.getCurrentExtension();

const createSliderNumberPatch = ({ _level: slider }) => {
  let lastEffect = null;
  const _settings = ExUtils.getSettings();
  
  const config = () => ({
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
    
  const getVolume = () => parseInt(run('pactl list sinks')[1].toString().match(/[0-9]{1,3}[%]/mid)[0])/100;
  
  const callEffect = (v, p, { enabled:on, effects:e } = config()) => on ? setEffect(e[p][!!v]) : setEffect(e.defaultColor);
    
  const setEffect = (effect) => {
    if (lastEffect !== effect) {
      Polychromatic([config().polychromaticPath, '-e', effect], null);
      lastEffect = effect?.replace('static-', '') || effect;
    }
  };

  let settingsId = _settings.connect('changed::keyboard-options-enabled', () => callEffect(getVolume(), 'static'));
  let valueChangedId = slider.connect('notify::value', ({ _value }) => callEffect(_value, 'dinamic'));
  
  callEffect(getVolume(), 'static');

  return () => {
    callEffect()
    slider.disconnect(valueChangedId);
    _settings.disconnect(settingsId);
  }
}

function init() {
  ExUtils.initTranslations();
  let patches = [];
  return {
    enable:() => patches = Osd.map(createSliderNumberPatch),
    disable:() => patches = patches.forEach(run) || [],
  };
};
