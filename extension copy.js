const { 
  gi: { Gio, GLib, GObject },
  misc: { extensionUtils },
  ui: { main: Main },
} = imports;

const Me = extensionUtils.getCurrentExtension();

class SliderNumberPatch {
  constructor(widget) {
    this.widget = widget;
    this._settings = extensionUtils.getSettings();
    this.oldValue = null;

    this._valueChangedId = this.slider.connect('notify::value', ({_value}) => {
      this._changeKeyboardColor(_value, 'dinamic');
    });

    this._settingsId = this._settings.connect('changed::keyboard-options-enabled', () => {
      this._setInitialKeyboardColor();
    });

    this._setInitialKeyboardColor();
  }

  get slider() {
    return this.widget._level;
  }

  get enabled() {
    return this._settings.get_boolean('keyboard-options-enabled');
  }
  
  get polychromaticPath() {
    return this._settings.get_string('polychromatic-path')
  }
1
  get effects(){
    return {
      dinamic: {
        mute:     this._settings.get_string('dinamic-mute'),
        unMute:   this._settings.get_string('dinamic-unmute'),
      },
      static: {
        disabled: this._settings.get_string('default-color'),
        mute:     this._settings.get_string('static-mute'),
        unMute:   this._settings.get_string('static-unmute'),
      },
    }
  }

  _getSystemVolumePactl() {
    const stdout = GLib.spawn_command_line_sync('pactl list sinks')[1].toString();
    return parseInt(stdout.match(/[0-9]{1,3}[%]/mid)[0]) / 100 || null
  }
  
  _setInitialKeyboardColor() {
    this.oldValue = null;
    this._changeKeyboardColor(this._getSystemVolumePactl(), 'static')
  }
  
  _setDefaultKeyboardEffect() {
    const { static: { disabled } } = this.effects
    this._setKeyboardEffect(disabled, null)
  }

  _changeKeyboardColor(v, pattern) { 
    const { mute, unMute } = this.effects[pattern];
    const value = v ? unMute : mute;

    if(this.enabled){
      this.oldValue != value && this._setKeyboardEffect(value, value)
    } else {
      this._setDefaultKeyboardEffect()
    }
  }
  
  _setKeyboardEffect(effect, result) {
    Gio.Subprocess.new([this.polychromaticPath, '-e', effect], null);
    this.oldValue = result;
  }

  unpatch() {
    this._setDefaultKeyboardEffect()
    this.slider.disconnect(this._valueChangedId);
    this._settings.disconnect(this._settingsId);
    this._valueChangedId = null;
    this._settingsId = null;
  }
}

class Extension {
  constructor() {
    extensionUtils.initTranslations();
  }

  enable() {
    this.patches = [];
    this._patch();
  }

  _patch() {
    this.patches = this.osdWindows
      .map(w => new SliderNumberPatch(w));
      global.log('los patches: ' + JSON.stringify(this.patches))
  }

  _unpatch() {
    for (const p of this.patches) {
      p.unpatch();
    }
    this.patches = [];
  }

  get osdWindows() {
    return main.osdWindowManager._osdWindows;
  }
  
  disable() {
    this._unpatch();
  }
}

function init() {
  return new Extension();
}
