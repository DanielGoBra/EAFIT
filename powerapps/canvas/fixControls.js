// Fix pac-generated simplified Controls JSON to match full Power Apps Studio format
// Run: node fixControls.js

const fs = require('fs');
const path = require('path');

const CONTROLS_DIR = process.argv[2] || 'c:/EAFIT/powerapps/canvas/msapp_v3_tmp/Controls';

// Template definitions for standard controls
const TEMPLATES = {
  screen: {
    Id: "http://microsoft.com/appmagic/screen",
    Version: "1.0",
    LastModifiedTimestamp: "0",
    Name: "screen",
    FirstParty: true,
    IsPremiumPcfControl: false,
    IsCustomGroupControlTemplate: false,
    CustomGroupControlTemplateName: "",
    IsComponentDefinition: false,
    OverridableProperties: {}
  },
  rectangle: {
    Id: "http://microsoft.com/appmagic/rectangle",
    Version: "2.3.0",
    LastModifiedTimestamp: "0",
    Name: "rectangle",
    FirstParty: true,
    IsPremiumPcfControl: false,
    IsCustomGroupControlTemplate: false,
    CustomGroupControlTemplateName: "",
    IsComponentDefinition: false,
    OverridableProperties: {}
  },
  label: {
    Id: "http://microsoft.com/appmagic/label",
    Version: "2.6.1",
    LastModifiedTimestamp: "0",
    Name: "label",
    FirstParty: true,
    IsPremiumPcfControl: false,
    IsCustomGroupControlTemplate: false,
    CustomGroupControlTemplateName: "",
    IsComponentDefinition: false,
    OverridableProperties: {}
  },
  button: {
    Id: "http://microsoft.com/appmagic/button",
    Version: "2.1.0",
    LastModifiedTimestamp: "0",
    Name: "button",
    FirstParty: true,
    IsPremiumPcfControl: false,
    IsCustomGroupControlTemplate: false,
    CustomGroupControlTemplateName: "",
    IsComponentDefinition: false,
    OverridableProperties: {}
  },
  textInput: {
    Id: "http://microsoft.com/appmagic/textinput",
    Version: "2.3.2",
    LastModifiedTimestamp: "0",
    Name: "textInput",
    FirstParty: true,
    IsPremiumPcfControl: false,
    IsCustomGroupControlTemplate: false,
    CustomGroupControlTemplateName: "",
    IsComponentDefinition: false,
    OverridableProperties: {}
  },
  appinfo: {
    Id: "http://microsoft.com/appmagic/appinfo",
    Version: "1.0",
    LastModifiedTimestamp: "0",
    Name: "appinfo",
    FirstParty: true,
    IsPremiumPcfControl: false,
    IsCustomGroupControlTemplate: false,
    CustomGroupControlTemplateName: "",
    IsComponentDefinition: false,
    OverridableProperties: {}
  },
  hostControl: {
    Id: "http://microsoft.com/appmagic/hostcontrol",
    Version: "1.6.0",
    LastModifiedTimestamp: "0",
    Name: "hostControl",
    FirstParty: true,
    IsPremiumPcfControl: false,
    IsCustomGroupControlTemplate: false,
    CustomGroupControlTemplateName: "",
    IsComponentDefinition: false,
    HostType: "Default",
    OverridableProperties: {}
  }
};

// Behavior properties (everything else is Design)
const BEHAVIOR_PROPS = new Set([
  'OnSelect', 'OnChange', 'OnVisible', 'OnHidden', 'OnStart', 'OnReset',
  'OnNew', 'OnEdit', 'OnView', 'OnSave', 'OnCancel', 'OnCheck', 'OnUncheck',
  'OnTimerStart', 'OnTimerEnd', 'OnEnd', 'OnPause', 'OnNavigation',
  'OnSuccess', 'OnError', 'OnAddFile', 'OnRemoveFile'
]);

// StyleName map per template
const STYLE_NAMES = {
  screen: 'defaultScreenStyle',
  rectangle: 'defaultRectangleStyle',
  label: 'defaultLabelStyle',
  button: 'defaultButtonStyle',
  textInput: 'defaultTextInputStyle',
  appinfo: '',
  hostControl: ''
};

// Screen-level default rules to ADD if missing
const SCREEN_DEFAULT_RULES = [
  { Property: "Fill", Category: "Design", InvariantScript: "RGBA(255, 255, 255, 1)", RuleProviderType: "Unknown" },
  { Property: "ImagePosition", Category: "Design", InvariantScript: "ImagePosition.Fit", RuleProviderType: "Unknown" },
  { Property: "Height", Category: "Design", InvariantScript: "Max(App.Height, App.MinScreenHeight)", RuleProviderType: "Unknown" },
  { Property: "Width", Category: "Design", InvariantScript: "Max(App.Width, App.MinScreenWidth)", RuleProviderType: "Unknown" },
  { Property: "Size", Category: "Design", InvariantScript: "1 + CountRows(App.SizeBreakpoints) - CountIf(App.SizeBreakpoints, Value >= Self.Width)", RuleProviderType: "Unknown" },
  { Property: "Orientation", Category: "Design", InvariantScript: "If(Self.Width < Self.Height, Layout.Vertical, Layout.Horizontal)", RuleProviderType: "Unknown" },
  { Property: "LoadingSpinner", Category: "Design", InvariantScript: "LoadingSpinner.None", RuleProviderType: "Unknown" },
  { Property: "LoadingSpinnerColor", Category: "Design", InvariantScript: "RGBA(0, 120, 212, 1)", RuleProviderType: "Unknown" }
];

function getCategory(propName) {
  return BEHAVIOR_PROPS.has(propName) ? 'Behavior' : 'Design';
}

function fixControl(ctrl, isTopLevel = false, parentName = '') {
  const templateName = ctrl.Template && ctrl.Template.Name ? ctrl.Template.Name : 'unknown';
  const isScreen = isTopLevel && templateName === 'screen';
  const isApp = isTopLevel && templateName === 'appinfo';

  // Build fixed control
  const fixed = {
    Type: "ControlInfo",
    Name: ctrl.Name,
    HasDynamicProperties: ctrl.HasDynamicProperties || false
  };

  // Full Template
  if (TEMPLATES[templateName]) {
    fixed.Template = { ...TEMPLATES[templateName] };
  } else {
    fixed.Template = { ...ctrl.Template };
    console.warn(`  Unknown template: ${templateName} for ${ctrl.Name}`);
  }

  fixed.Index = ctrl.Index !== undefined ? ctrl.Index : 0;
  fixed.PublishOrderIndex = ctrl.PublishOrderIndex || 0;
  fixed.VariantName = ctrl.VariantName || '';
  fixed.LayoutName = ctrl.LayoutName || '';
  fixed.MetaDataIDKey = ctrl.MetaDataIDKey || '';
  fixed.PersistMetaDataIDKey = ctrl.PersistMetaDataIDKey || false;
  fixed.IsFromScreenLayout = ctrl.IsFromScreenLayout || false;
  fixed.StyleName = STYLE_NAMES[templateName] || '';
  fixed.Parent = parentName;
  fixed.IsDataControl = isApp ? true : (ctrl.IsDataControl || false);
  fixed.AllowAccessToGlobals = ctrl.AllowAccessToGlobals !== undefined ? ctrl.AllowAccessToGlobals : (isTopLevel ? true : false);
  fixed.OptimizeForDevices = ctrl.OptimizeForDevices || 'Off';
  fixed.IsGroupControl = ctrl.IsGroupControl || false;
  fixed.IsAutoGenerated = ctrl.IsAutoGenerated || false;

  // Fix Rules - add Category field, add Data/Behavior distinction
  let rules = (ctrl.Rules || []).map(rule => {
    const cat = rule.Category || getCategory(rule.Property);
    const fixed_rule = {
      Property: rule.Property,
      Category: cat,
      InvariantScript: rule.InvariantScript,
      RuleProviderType: rule.RuleProviderType || 'Unknown'
    };
    return fixed_rule;
  });

  // For screens: ensure default rules exist, merge with Fill override
  if (isScreen) {
    const existingProps = new Set(rules.map(r => r.Property));

    // Set Fill from existing or default
    const fillRule = rules.find(r => r.Property === 'Fill');

    // Add standard screen rules if not present
    for (const defaultRule of SCREEN_DEFAULT_RULES) {
      if (!existingProps.has(defaultRule.Property)) {
        // Use existing fill if we have it
        if (defaultRule.Property === 'Fill' && fillRule) continue;
        rules.push({ ...defaultRule });
      }
    }
  }

  fixed.Rules = rules;
  fixed.ControlPropertyState = rules.map(r => r.Property);
  fixed.IsLocked = ctrl.IsLocked || false;
  fixed.ControlUniqueId = ctrl.ControlUniqueId || String(Math.floor(Math.random() * 10000));

  // Recursively fix children
  fixed.Children = (ctrl.Children || []).map(child =>
    fixControl(child, false, ctrl.Name)
  );

  return fixed;
}

// Process all Control files
const files = fs.readdirSync(CONTROLS_DIR).filter(f => f.endsWith('.json'));
console.log(`Processing ${files.length} control files...`);

for (const file of files) {
  const filePath = path.join(CONTROLS_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const parent = data.TopParent;
  const isScreen = parent.Template && parent.Template.Name === 'screen';
  const isApp = parent.Template && parent.Template.Name === 'appinfo';

  console.log(`\nFixing ${file}: ${parent.Name} (${parent.Template && parent.Template.Name})`);

  const fixed = fixControl(parent, true, '');

  const output = { TopParent: fixed };
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  console.log(`  ✓ Written (${(JSON.stringify(output).length / 1024).toFixed(1)} KB)`);
}

console.log('\nDone! All Controls/*.json files fixed.');
