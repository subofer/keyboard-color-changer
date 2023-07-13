const {
  misc: {
    extensionUtils: ExtensionUtils,
  },
  gettext: {
    domain,
  },
  gi: {
    Gio,
    Gtk,
    Adw,
  },
} = imports;
const Me = ExtensionUtils.getCurrentExtension();

const { gettext: _ } = domain('keyboard-color-changer');

function init() {
  ExtensionUtils.initTranslations();
}

function createSwitchRow(title, settingsKey) {
  const row = new Adw.ActionRow({ title });
  
  const toggle = new Gtk.Switch({ valign: Gtk.Align.CENTER });
  row.add_suffix(toggle);
  row.activatable_widget = toggle;

  const settings = ExtensionUtils.getSettings();
  toggle.active = settings.get_boolean(settingsKey);
  toggle.connect('notify::active', () => {
    settings.set_boolean(settingsKey, toggle.active);
  });

  return row;
}

function createTextInput(title, settingsKey) {
  const row = new Adw.ActionRow({ title });

  const box = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    margin_top: 6,
    margin_bottom: 6,
  });

  const entry = new Gtk.Entry({
    hexpand: false,
    max_width_chars: 30,
  });

  box.append(entry);

  row.add_suffix(box);

  const settings = ExtensionUtils.getSettings();
  const currentValue = settings.get_string(settingsKey);
  entry.text = currentValue !== null ? currentValue : '';

  entry.connect('changed', () => {
    settings.set_string(settingsKey, entry.text);
  });

  return row;
}

function fillPreferencesWindow(window) {
  const settings = ExtensionUtils.getSettings();

  const page = new Adw.PreferencesPage();
  const group = new Adw.PreferencesGroup();
  page.add(group);

  const textOptionsSwitch = createSwitchRow(
    _('Activar efectos de teclado'),
    'keyboard-options-enabled'
  );

  const polychromaticEntry = createTextInput(
    _('Ruta a CLI del teclado'),
    'polychromatic-path'
  );

  const efectoMute = createTextInput(
    _('Efecto Mute'),
    'dinamic-mute'
  );

  const efectoUnMute = createTextInput(
    _('Efecto unMute'),
    'dinamic-unmute'
  );

  const staticMute = createTextInput(
    _('Estatico Mute'),
    'static-mute'
  );

  const staticUnMute = createTextInput(
    _('Estatico unMute'),
    'static-unmute'
  );

  const defaultColorEntry = createTextInput(
    _('Color por defecto'),
    'default-color'
  );

  const updateSetting = () => {
    const isTextOptionsEnabled = settings.get_boolean('keyboard-options-enabled');
    textOptionsSwitch.activatable_widget.active = isTextOptionsEnabled;
  };

  updateSetting();

  group.add(textOptionsSwitch);
  group.add(polychromaticEntry);
  group.add(efectoMute);
  group.add(efectoUnMute);
  group.add(staticMute);
  group.add(staticUnMute);
  group.add(defaultColorEntry);

  const handlerIds = [
    'keyboard-options-enabled',
    'polychromatic-path',
    'efecto-mute',
    'efecto-unmute',
    'static-mute',
    'static-unmute',
    'default-color',
  ].map(s => settings.connect(`changed::${s}`, updateSetting));

  page.connect('destroy', () => {
    for (const hid of handlerIds) {
      settings.disconnect(hid);
    }
  });

  window.default_width = 500;
  window.default_height = 480;
  window.add(page);
}
