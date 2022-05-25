/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Extension Manager.
 *
 * The Initial Developer of the Original Code is Ben Goodger.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Ben Goodger <ben@bengoodger.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const nsIExtensionManager             = Components.interfaces.nsIExtensionManager;
const nsIUpdateService                = Components.interfaces.nsIUpdateService;
const nsIUpdateItem                   = Components.interfaces.nsIUpdateItem;

const PREF_EM_APP_ID                  = "app.id";
const PREF_EM_APP_VERSION             = "app.version";
const PREF_EM_APP_EXTENSIONS_VERSION  = "app.extensions.version";
const PREF_EM_APP_BUILDID             = "app.build_id";
const PREF_EM_LAST_APP_VERSION        = "extensions.lastAppVersion";
const PREF_UPDATE_COUNT               = "extensions.update.count";
const PREF_UPDATE_DEFAULT_URL         = "extensions.update.url";
const PREF_EM_WASINSAFEMODE           = "extensions.wasInSafeMode";
const PREF_EM_DISABLEDOBSOLETE        = "extensions.disabledObsolete";
const PREF_EM_LAST_SELECTED_SKIN      = "extensions.lastSelectedSkin";
const PREF_EM_EXTENSION_FORMAT        = "extensions.%UUID%.";
const PREF_EM_ITEM_UPDATE_ENABLED     = "extensions.%UUID%.update.enabled";
const PREF_EM_ITEM_UPDATE_URL         = "extensions.%UUID%.update.url";
const PREF_EM_DSS_ENABLED             = "extensions.dss.enabled";

const PREF_GENERAL_SKINS_SELECTEDSKIN = "general.skins.selectedSkin";

const DIR_EXTENSIONS                  = "extensions";
const DIR_UNINSTALL                   = "uninstall";
const DIR_TEMP                        = "temp";
const DIR_CHROME                      = "chrome";
const DIR_COMPONENTS                  = "components";
const DIR_DEFAULTS                    = "defaults";
const DIR_DEFAULTS_PREFS              = "preferences";
const DIR_DEFAULTS_EXTENSIONS         = "extensions"; 
const DIR_CR_CHROME                   = "chrome";
const DIR_CR_OVERLAYINFO              = "overlayinfo";
const FILE_CR_CHROMEDS                = "chrome.rdf";
const FILE_EXTENSIONS                 = "Extensions.rdf";
const FILE_UNINSTALL_LOG              = "Uninstall";
const FILE_DEFAULTS                   = "defaults.ini";
const FILE_COMPONENT_MANIFEST         = "components.ini";
const FILE_COMPAT_MANIFEST            = "compatibility.ini";
const FILE_INSTALL_MANIFEST           = "install.rdf";
const FILE_CHROME_MANIFEST            = "contents.rdf";
const FILE_WASINSAFEMODE              = "Safe Mode";
const FILE_INSTALLED_EXTENSIONS       = "installed-extensions.txt"
const FILE_INSTALLED_EXTENSIONS_PROCESSED = "installed-extensions-processed.txt"

const KEY_PROFILEDIR                  = "ProfD";
const KEY_APPDIR                      = "XCurProcD";
const KEY_APPCHROMEDIR                = "AChrom";
const KEY_PROFILECHROMEDIR            = "UChrm";
const KEY_DEFAULTS                    = "ProfDefNoLoc";
const KEY_DEFAULT_THEME               = "classic/1.0";

const ERROR_INVALID_VERSION           = -1;
const ERROR_PHONED_HOME               = -2;
const ERROR_EXTENSION_IS_THEME        = -3;

var gPref           = null;
var gRDF            = null;
var gOS             = null;
var gVersionChecker = null;

function getVersionChecker()
{
  if (!gVersionChecker) {
    gVersionChecker = Components.classes["@mozilla.org/updates/version-checker;1"]
                                .getService(Components.interfaces.nsIVersionChecker);
  }
  return gVersionChecker;
}

///////////////////////////////////////////////////////////////////////////////
//
// Utility Functions
//
const EM_NS_PREFIX      = "http://www.mozilla.org/2004/em-rdf#";
const CHROME_NS_PREFIX  = "http://www.mozilla.org/rdf/chrome#";

function EM_NS(aProperty)
{
  return EM_NS_PREFIX + aProperty;
}

function CHROME_NS(aProperty)
{
  return CHROME_NS_PREFIX + aProperty;
}

// Returns the specified directory hierarchy under the special directory 
// specified by aKey, creating directories along the way if necessary.
function getDir(aKey, aSubDirs)
{
  return getDirInternal(aKey, aSubDirs, true);
}

function getDirNoCreate(aKey, aSubDirs)
{
  return getDirInternal(aKey, aSubDirs, false);
}

function getDirInternal(aKey, aSubDirs, aCreate)
{
  var fileLocator = Components.classes["@mozilla.org/file/directory_service;1"]
                              .getService(Components.interfaces.nsIProperties);
  var dir = fileLocator.get(aKey, Components.interfaces.nsIFile);
  for (var i = 0; i < aSubDirs.length; ++i) {
    dir.append(aSubDirs[i]);
    if (aCreate && !dir.exists())
      dir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);
  }
  return dir;
}

// Returns the file at the appropriate point in a directory hierarchy under
// the specified key, creating directories along the way if necessary. Does
// NOT create the file.
function getFile(aKey, aPathToFile)
{
  var subdirs = [];
  for (var i = 0; i < aPathToFile.length - 1; ++i)
    subdirs.push(aPathToFile[i]);
  var file = getDir(aKey, subdirs);
  file.append(aPathToFile[aPathToFile.length - 1]);
  return file;
}

function getDirKey(aIsProfile)
{
  return aIsProfile ? KEY_PROFILEDIR : KEY_APPDIR;
}

function dumpFile(aFile)
{
  dump("*** file = " + aFile.path + ", exists = " + aFile.exists() + "\n");
}

// We use this to force RDF to bypass the cache when loading certain types
// of files. 
function getRandomFileName(aName, aExtension)
{
  var characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  var nameString = aName + "-";
  for (var i = 0; i < 3; ++i) {
    var index = Math.round((Math.random()) * characters.length);
    nameString += characters.charAt(index);
  }
  return nameString + "." + aExtension;
}

const PREFIX_EXTENSION  = "urn:mozilla:extension:";
const PREFIX_THEME      = "urn:mozilla:theme:";
const ROOT_EXTENSION    = "urn:mozilla:extension:root";
const ROOT_THEME        = "urn:mozilla:theme:root";

function getItemPrefix(aItemType)
{
  var prefix = "";
  if (aItemType & nsIUpdateItem.TYPE_EXTENSION) 
    prefix = PREFIX_EXTENSION;
  else if (aItemType & nsIUpdateItem.TYPE_THEME)
    prefix = PREFIX_THEME;
  return prefix;
}

function getItemRoot(aItemType)
{
  var root = "";
  if (aItemType & nsIUpdateItem.TYPE_EXTENSION) 
    root = ROOT_EXTENSION;
  else if (aItemType & nsIUpdateItem.TYPE_THEME)
    root = ROOT_THEME;
  return root;
}

function getItemRoots(aItemType)
{    
  var roots = [];
  if (aItemType == nsIUpdateItem.TYPE_ADDON)
    roots = roots.concat([getItemRoot(nsIUpdateItem.TYPE_EXTENSION), 
                          getItemRoot(nsIUpdateItem.TYPE_THEME)]);
  else
    roots.push(getItemRoot(aItemType));
  return roots;
}

function getItemType(aURI)
{
  var type = -1;
  if (aURI.substr(0, PREFIX_EXTENSION.length) == PREFIX_EXTENSION)
    type = nsIUpdateItem.TYPE_EXTENSION;
  else if (aURI.substr(0, PREFIX_THEME.length) == PREFIX_THEME)
    type = nsIUpdateItem.TYPE_THEME;
  return type;
}

function stripPrefix(aURI, aItemType)
{
  var val = aURI;
  if (aItemType == nsIUpdateItem.TYPE_ADDON)
    val = stripPrefix(aURI, getItemType(aURI));
  else {
    var prefix = getItemPrefix(aItemType);
    if (prefix && aURI.substr(0, prefix.length) == prefix)  
      val = aURI.substr(prefix.length, aURI.length);
  }
  return val;
}

function stripPropertyPrefix(aProperty, aPrefix)
{
  return aProperty.substr(aPrefix.length, aProperty.length);
}

function getURLSpecFromFile(aFile)
{
  var ioServ = Components.classes["@mozilla.org/network/io-service;1"]
                          .getService(Components.interfaces.nsIIOService);
  var fph = ioServ.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
  return fph.getURLSpecFromFile(aFile);
}

function ensureExtensionsFiles(aIsProfile)
{
  try {
    var extensionsFile  = getFile(getDirKey(aIsProfile), 
                                  [DIR_EXTENSIONS, FILE_EXTENSIONS]);
  
    // If the file does not exist at the current location, copy the default
    // version over so we can access the various roots. 
    // This is a sign also that something may have gone wrong, such as the user
    // deleting /Extensions so we should remove the relative contents.rdf and
    // overlayinfo hierarchies too. 
    if (extensionsFile && !extensionsFile.exists()) {
      var defaultFile = getFile(KEY_DEFAULTS, 
                                [DIR_DEFAULTS_EXTENSIONS, FILE_EXTENSIONS]);
      defaultFile.copyTo(extensionsFile.parent, extensionsFile.leafName);

      // XXXben - do this only for profile until we have a better protection 
      // mechanism for global items.
      if (aIsProfile) {
        try {      
          var chromedsFile = getFile(getDirKey(aIsProfile), [DIR_CR_CHROME, FILE_CR_CHROMEDS]);
          if (chromedsFile.exists())
            chromedsFile.remove(false);
          var overlayinfoDir = getDir(getDirKey(aIsProfile), [DIR_CR_CHROME, DIR_CR_OVERLAYINFO]);
          if (overlayinfoDir.exists())
            overlayinfoDir.remove(true);
        }
        catch (e) { 
          dump("Extension System Warning: failed to remove chrome.rdf/overlay info because: " + e + "\n"); 
        }
      }
    }
  }
  catch (e) { 
    // Too early in the startup process to use the console, we may yet restart
    // the app.
    dump("Extension System Warning: Failed to set up default extensions" + 
         " files probably because you do not have write privileges to this" + 
         " location. While you can run Firefox like this, it is recommended" + 
         " that you run it at least once with privileges that allow it to generate" + 
         " these initial files to improve start performance. Running from a disk" + 
         " image on MacOS X is not recommended.");
  }
}

function stringData(aLiteralOrResource)
{
  try {
    var obj = aLiteralOrResource.QueryInterface(Components.interfaces.nsIRDFLiteral);
    return obj.Value;
  }
  catch (e) {
    try {
      obj = aLiteralOrResource.QueryInterface(Components.interfaces.nsIRDFResource);
      return obj.Value;
    }
    catch (e) {}
  }
  return "--";
}

function stackTraceFunctionFormat(aFunctionName)
{
  var classDelimiter = aFunctionName.indexOf("_");
  var className = aFunctionName.substr(0, classDelimiter);
  if (!className)
    className == "<global>";
  var functionName = aFunctionName.substr(classDelimiter + 1, aFunctionName.length);
  if (!functionName) 
    functionName == "<anonymous>";
  return className + "::" + functionName;
}

function stackTrace(aArguments, aMaxCount)
{
  dump("=[STACKTRACE]=====================================================\n");
  dump("*** at: " + stackTraceFunctionFormat(aArguments.callee.name) + "()\n");
  var temp = aArguments.callee.caller;
  var count = 0;
  while (temp) {
    dump("***     " + stackTraceFunctionFormat(temp.name) + "()\n");
    
    temp = temp.arguments.callee.caller;
    if (aMaxCount > 0 && ++count == aMaxCount)
      break;
  }
  dump("==================================================================\n");
}

///////////////////////////////////////////////////////////////////////////////
// Incompatible Item Error Message
function showIncompatibleError(aDS)
{
  var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                      .getService(Components.interfaces.nsIStringBundleService);
  var extensionStrings = sbs.createBundle("chrome://mozapps/locale/extensions/extensions.properties");
  var params = [extensionStrings.GetStringFromName("extension")];
  var title = extensionStrings.formatStringFromName("incompatibleTitle", 
                                                    params, params.length);
  
  var brandStrings = sbs.createBundle("chrome://global/locale/brand.properties");
  var brandShortName = brandStrings.GetStringFromName("brandShortName");

  var message;
  var metadata = {};
  getItemMetadata(aDS, metadata);
  
  if (undefined === metadata.minAppVersion) {
    // getItemMetadata does not fill target application version range properties unless a 
    // matching supported target application is found.
    params = [metadata.name, metadata.version, brandShortName];
    message = extensionStrings.formatStringFromName("incompatibleMessageNoApp", 
                                                    params, params.length);
  }
  else if (metadata.minAppVersion == metadata.maxAppVersion) {
    // If the min target app version and the max target app version are the same, don't show
    // a message like, "Foo is only compatible with Firefox versions 0.7 to 0.7", rather just
    // show, "Foo is only compatible with Firefox 0.7"
    params = [metadata.name, metadata.version, brandShortName, metadata.name, 
              metadata.version, brandShortName, metadata.minAppVersion];
    message = extensionStrings.formatStringFromName("incompatibleMessageSingleAppVersion", 
                                                    params, params.length);
  }
  else {
    params = [metadata.name, metadata.version, brandShortName, metadata.name, 
              metadata.version, brandShortName, metadata.minAppVersion, 
              metadata.maxAppVersion];
    message = extensionStrings.formatStringFromName("incompatibleMessage", params, params.length);
  }
  var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                     .getService(Components.interfaces.nsIPromptService);
  ps.alert(null, title, message);
}

function showMalformedError(aFile)
{
  var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                      .getService(Components.interfaces.nsIStringBundleService);
  var extensionStrings = sbs.createBundle("chrome://mozapps/locale/extensions/extensions.properties");
  var title = extensionStrings.GetStringFromName("malformedTitle");

  var brandStrings = sbs.createBundle("chrome://global/locale/brand.properties");
  var brandShortName = brandStrings.GetStringFromName("brandShortName");
  var message = extensionStrings.formatStringFromName("malformedMessage", [brandShortName, aFile], 2);
  
  var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                     .getService(Components.interfaces.nsIPromptService);
  ps.alert(null, title, message);
}

function showInvalidVersionError(aItemName, aVersion)
{
  var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                      .getService(Components.interfaces.nsIStringBundleService);
  var extensionStrings = sbs.createBundle("chrome://mozapps/locale/extensions/extensions.properties");
  var title = extensionStrings.GetStringFromName("invalidVersionTitle");

  var brandStrings = sbs.createBundle("chrome://global/locale/brand.properties");
  var brandShortName = brandStrings.GetStringFromName("brandShortName");
  var params = [brandShortName, aItemName, aVersion];
  var message = extensionStrings.formatStringFromName("invalidVersionMessage", params, params.length);
  
  var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                     .getService(Components.interfaces.nsIPromptService);
  ps.alert(null, title, message);
}

function showOldThemeError(aDS)
{
  var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                      .getService(Components.interfaces.nsIStringBundleService);
  var extensionStrings = sbs.createBundle("chrome://mozapps/locale/extensions/extensions.properties");
  var params = [extensionStrings.GetStringFromName("theme")];
  var title = extensionStrings.formatStringFromName("incompatibleTitle", 
                                                    params, params.length);

  var brandStrings = sbs.createBundle("chrome://global/locale/brand.properties");
  var brandShortName = brandStrings.GetStringFromName("brandShortName");
  var appVersion = extensionStrings.GetStringFromName("incompatibleOlder");
  
  try {  
    var rdfc = Components.classes["@mozilla.org/rdf/container;1"]
                         .createInstance(Components.interfaces.nsIRDFContainer);
    rdfc.Init(aDS, gRDF.GetResource("urn:mozilla:skin:root"));
    
    var elts = rdfc.GetElements();
    var nameArc = gRDF.GetResource(CHROME_NS("displayName"));
    while (elts.hasMoreElements()) {
      var elt = elts.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      themeName = stringData(aDS.GetTarget(elt, nameArc, true));
      if (themeName) 
        break;
    }
  }
  catch (e) {
    themeName = extensionStrings.GetStringFromName("incompatibleThemeName");
  }
  
  params = [themeName, "", brandShortName, themeName, "", brandShortName, appVersion];
  var message = extensionStrings.formatStringFromName("incompatibleMessageSingleAppVersion",
                                                      params, params.length);
  var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                     .getService(Components.interfaces.nsIPromptService);
  ps.alert(null, title, message);
}

function showMissingFileError(aSourceFile, aMissingFileName)
{
  var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                      .getService(Components.interfaces.nsIStringBundleService);
  var extensionStrings = sbs.createBundle("chrome://mozapps/locale/extensions/extensions.properties");
  var title = extensionStrings.GetStringFromName("missingFileTitle");

  var brandStrings = sbs.createBundle("chrome://global/locale/brand.properties");
  var brandShortName = brandStrings.GetStringFromName("brandShortName");
  var params = [brandShortName, aMissingFileName];
  var message = extensionStrings.formatStringFromName("missingFileMessage", params, params.length);
  
  var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                     .getService(Components.interfaces.nsIPromptService);
  ps.alert(null, title, message);

  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);
  params = [aSourceFile, aMissingFileName];
  var consoleMessage = extensionStrings.formatStringFromName("missingFileConsoleMessage",
                                                             params, params.length);
  consoleService.logStringMessage(consoleMessage);
}

function showMalformedRegistrationError(aCRException)
{
  var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                      .getService(Components.interfaces.nsIStringBundleService);
  var extensionStrings = sbs.createBundle("chrome://mozapps/locale/extensions/extensions.properties");
  var title = extensionStrings.GetStringFromName("malformedRegistrationTitle");

  var brandStrings = sbs.createBundle("chrome://global/locale/brand.properties");
  var brandShortName = brandStrings.GetStringFromName("brandShortName");
  var params = [brandShortName];
  var message = extensionStrings.formatStringFromName("malformedRegistrationMessage", 
                                                      params, params.length);
  var detailsButtonMessage = extensionStrings.GetStringFromName("malformedRegistrationDetailsButton");
  
  var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                     .getService(Components.interfaces.nsIPromptService);
  var flags = (ps.BUTTON_TITLE_IS_STRING * ps.BUTTON_POS_1) +  
              (ps.BUTTON_TITLE_OK * ps.BUTTON_POS_0);
  var result = ps.confirmEx(null, title, message, flags, null, detailsButtonMessage, null, null, { } );
  if (result == 1) {  
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                  .getService(Components.interfaces.nsIConsoleService);
    params = [aCRException.extensionID, aCRException.functionName,
              aCRException.chromePath, aCRException.isProfile, ];
    var consoleMessage = extensionStrings.formatStringFromName("malformedRegistrationConsoleMessage",
                                                               params, params.length);
    consoleService.logStringMessage(consoleMessage);
    
    var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                        .getService(Components.interfaces.nsIWindowWatcher);
    ww.openWindow(null, "chrome://global/content/console.xul", 
                  "", "chrome,modal,centerscreen,resizable", null);
  }
}

function getItemMetadata(aDS, aResult)
{
  var manifestRoot = gRDF.GetResource("urn:mozilla:install-manifest");

  // Extension Name and Version
  var props = ["name", "version"];
  for (var i = 0; i < props.length; ++i) {
    var prop = gRDF.GetResource(EM_NS(props[i]));
    aResult[props[i]] = stringData(aDS.GetTarget(manifestRoot, prop, true));
  }
  
  // Target App Name and Version
  var appID = gPref.getCharPref(PREF_EM_APP_ID);

  var targets = aDS.GetTargets(manifestRoot, gRDF.GetResource(EM_NS("targetApplication")), true);
  var idRes = gRDF.GetResource(EM_NS("id"));
  var minVersionRes = gRDF.GetResource(EM_NS("minVersion"));
  var maxVersionRes = gRDF.GetResource(EM_NS("maxVersion"));
  while (targets.hasMoreElements()) {
    var targetApp = targets.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
    var id          = stringData(aDS.GetTarget(targetApp, idRes, true));
    var minVersion  = stringData(aDS.GetTarget(targetApp, minVersionRes, true));
    var maxVersion  = stringData(aDS.GetTarget(targetApp, maxVersionRes, true));

    if (id == appID) {
      aResult.minAppVersion = minVersion;
      aResult.maxAppVersion = maxVersion;
      break;
    }
  }
}

function getInstallManifest(aFile)
{
  var fileURL = getURLSpecFromFile(aFile);
  var ds = gRDF.GetDataSourceBlocking(fileURL);
  var manifestRoot = gRDF.GetResource("urn:mozilla:install-manifest");
  var arcs = ds.ArcLabelsOut(manifestRoot);
  if (!arcs.hasMoreElements()) {
    ds = null;
    var uri = Components.classes["@mozilla.org/network/standard-url;1"]
                        .createInstance(Components.interfaces.nsIURI);
    uri.spec = fileURL;
    var url = uri.QueryInterface(Components.interfaces.nsIURL);
    showMalformedError(url.fileName);
  }
  return ds;
}

function ArrayEnumerator(aItems)
{
  this._index = 0;
  
  if (aItems) {
    for (var i = 0; i < aItems.length; ++i) {    
      if (!aItems[i])
        aItems.splice(i, 1);      
    }
  }
  
  this._contents = aItems;
}

ArrayEnumerator.prototype = {
  _index: 0,
  _contents: [],
  
  hasMoreElements: function ArrayEnumerator_hasMoreElements()
  {
    return this._index < this._contents.length;
  },
  
  getNext: function ArrayEnumerator_getNext()
  {
    return this._contents[this._index++];      
  }
};
  
///////////////////////////////////////////////////////////////////////////////
//
// nsInstallLogBase
//
function nsInstallLogBase()
{
}

nsInstallLogBase.prototype = {
  CHROME_TYPE_PACKAGE   : "package",
  CHROME_TYPE_SKIN      : "skin",
  CHROME_TYPE_LOCALE    : "locale",

  TOKEN_ADD_FILE        : "add",
  TOKEN_REGISTER_CHROME : "register",
  TOKEN_PROFILE         : "profile",
  TOKEN_GLOBAL          : "global",
  TOKEN_SKIN            : "skin"
};

///////////////////////////////////////////////////////////////////////////////
//
// nsInstallLogWriter
//
function nsInstallLogWriter(aExtensionID, aIsProfile)
{
  this._isProfile = aIsProfile;
  this._uninstallLog = getDir(getDirKey(aIsProfile),
                              [DIR_EXTENSIONS, aExtensionID, DIR_UNINSTALL]);
  this._uninstallLog.append(FILE_UNINSTALL_LOG);
}

nsInstallLogWriter.prototype = {
  __proto__       : nsInstallLogBase.prototype,
  _uninstallLog   : null,
  
  open: function nsInstallLogWriter_open ()
  {
    this._fos = Components.classes["@mozilla.org/network/file-output-stream;1"]
                          .createInstance(Components.interfaces.nsIFileOutputStream);
    const MODE_WRONLY   = 0x02;
    const MODE_CREATE   = 0x08;
    const MODE_TRUNCATE = 0x20;
    this._fos.init(this._uninstallLog, MODE_WRONLY | MODE_CREATE | MODE_TRUNCATE, 0644, 0);
  },
  
  close: function nsInstallLogWriter_close ()
  {
    this._fos.close();  
  },
  
  addFile: function nsInstallLogWriter_addFile (aFile) 
  {
    var line = "add\t" + aFile.persistentDescriptor + "\n";
    this._fos.write(line, line.length);
  },
  
  registerChrome: function nsInstallLogWriter_registerChrome (aProviderName, aChromeType, aIsProfile)
  {
    var profile = aIsProfile ? "profile" : "global";
    // register\tprofile\tpackage\t<provider_name>
    var line = "register\t" + profile + "\t" + aChromeType + "\t" + aProviderName + "\n";
    this._fos.write(line, line.length);
  },
  
  installSkin: function nsInstallLogWriter_installSkin (aSkinName, aIsProfile)
  {
    var profile = aIsProfile ? "profile" : "global";
    // register\tprofile\tpackage\t<provider_name>
    var line = "skin\t" + profile + "\t" + aSkinName + "\n";
    this._fos.write(line, line.length);
  }
};

///////////////////////////////////////////////////////////////////////////////
//
// nsInstallLogReader
//
function nsInstallLogReader(aExtensionID, aIsProfile, aListener)
{
  this._isProfile = aIsProfile;
  this.uninstallLog = getFile(getDirKey(aIsProfile),
                              [DIR_EXTENSIONS, aExtensionID, 
                               DIR_UNINSTALL, FILE_UNINSTALL_LOG]);
  this._listener = aListener
}

nsInstallLogReader.prototype = {
  __proto__       : nsInstallLogBase.prototype,
  uninstallLog    : null,
  _listener       : null,
  
  read: function nsInstallLogReader_read ()
  {
    if (!this.uninstallLog.exists())
      return;
  
    var fis = Components.classes["@mozilla.org/network/file-input-stream;1"]
                        .createInstance(Components.interfaces.nsIFileInputStream);
    fis.init(this.uninstallLog, -1, -1, false);
    var lis = fis.QueryInterface(Components.interfaces.nsILineInputStream);
    var line = { value: "" };
    var more = false;
    var lines = [];
    do {
      more = lis.readLine(line);
      lines.push(line.value);
    }
    while (more);
    fis.close();

    // Now that we've closed the stream we can remove all the files, unregister
    // chrome, etc. 
    //
    // The list of lines we pass to the uninstall handler should be in this
    // order:
    // 1) File additions
    // 2) Chrome Package Registrations
    // 3) Chrome Skin and Locale Registrations
    //
    // They must be in this order since skins and locales rely on packages, and
    // the packages they rely on is not stored in the registration line so we
    // simply "deselect" for every package installed by the extension.
    var dependentLines = [];
    for (var i = 0; i < lines.length; ++i) {
      var parts = lines[i].split("\t");
      if (parts[1] == this.TOKEN_REGISTER_CHROME && 
          (parts[2] == this.CHROME_TYPE_SKIN || 
           parts[2] == this.CHROME_TYPE_LOCALE)) {
        dependentLines.push(lines.splice(i, 1));
      }
    }
    lines.concat(dependentLines);
    
    for (var i = 0; i < lines.length; ++i)
      this._parseLine(lines[i]);
  },
  
  _parseLine: function nsInstallLogReader__parseLine(aLine)
  {
    var parts = aLine.split("\t");
    switch (parts[0]) {
    case this.TOKEN_ADD_FILE:
      var prefix = this.TOKEN_ADD_FILE + "\t";
      var filePD = aLine.substr(prefix.length, aLine.length);
      var lf = Components.classes["@mozilla.org/file/local;1"]
                         .createInstance(Components.interfaces.nsILocalFile);
      try {
        lf.persistentDescriptor = filePD;
        this._listener.onAddFile(lf);
      }
      catch (e) { 
        dump("*** nsInstallLogReader::_parseLine - failed to remove file " + e + "\n"); 
      }
      break;
    case this.TOKEN_REGISTER_CHROME:
      var isProfile = parts[1] == this.TOKEN_PROFILE;
      try {
        this._listener.onRegisterChrome(parts[3], lf, parts[2], isProfile);
      } 
      catch (e) {
        dump("*** nsInstallLogReader::_parseLine - failed to deregister chrome\n"); 
      }
      break;
    case this.TOKEN_SKIN:
      var isProfile = parts[1] == this.TOKEN_PROFILE;
      try {
        this._listener.onInstallSkin(parts[2], isProfile);
      } 
      catch (e) {
        dump("*** nsInstallLogReader::_parseLine - failed to uninstall skin\n"); 
      }
      break;
    }
  }
};

///////////////////////////////////////////////////////////////////////////////
//
// nsInstalledExtensionReader
//
function nsInstalledExtensionReader(aManager)
{
  this._installedExtensions = getFile(KEY_APPDIR,
                                      [DIR_EXTENSIONS, 
                                       FILE_INSTALLED_EXTENSIONS]);
  this._installedExtensionsProcessed = getFile(KEY_APPDIR,
                                               [DIR_EXTENSIONS, 
                                                FILE_INSTALLED_EXTENSIONS_PROCESSED]);
  this._manager = aManager;
}

nsInstalledExtensionReader.prototype = {
  _manager            : null,
  _installedExtensions: null,
  
  read: function nsInstalledExtensionReader_read ()
  {
    if (this._installedExtensionsProcessed.exists())
      return;
    
    if (!this._installedExtensions.exists()) {
      var defaultsList = getFile(KEY_DEFAULTS, [DIR_DEFAULTS_EXTENSIONS, FILE_INSTALLED_EXTENSIONS]);
      defaultsList.copyTo(getDir(KEY_APPDIR, [DIR_EXTENSIONS]), FILE_INSTALLED_EXTENSIONS);
    }
      
    var fis = Components.classes["@mozilla.org/network/file-input-stream;1"]
                        .createInstance(Components.interfaces.nsIFileInputStream);
    fis.init(this._installedExtensions, -1, -1, false);
    var lis = fis.QueryInterface(Components.interfaces.nsILineInputStream);
    var line = { value: "" };
    var more = false;
    var lines = [];
    do {
      more = lis.readLine(line);
      lines.push(line.value);
    }
    while (more);
    fis.close();

    // Now that we've closed the stream we can remove all the files    
    for (var i = 0; i < lines.length; ++i)
      this._parseLine(lines[i]);
    
    this._installedExtensions.moveTo(getDir(KEY_APPDIR, [DIR_EXTENSIONS]), 
                                     FILE_INSTALLED_EXTENSIONS_PROCESSED);
  },
  
  TOKEN_EXTENSION : "extension",
  TOKEN_THEME     : "theme",
  
  _parseLine: function nsInstalledExtensionReader__parseLine (aLine)
  {
    // extension,{GUID} or theme,{GUID}
    var parts = aLine.split(",");
    var manifest = getFile(KEY_APPDIR, 
                           [DIR_EXTENSIONS, parts[1], FILE_INSTALL_MANIFEST]);
    if (parts.length != 2)
      return;
      
    if (!manifest.exists()) {
      defaultManifest = defaultFile = getFile(KEY_DEFAULTS, 
                                              [DIR_DEFAULTS_EXTENSIONS, parts[1], FILE_INSTALL_MANIFEST]);
      var extensionDir = getDir(KEY_APPDIR, [DIR_EXTENSIONS, parts[1]]);
      defaultManifest.copyTo(extensionDir, FILE_INSTALL_MANIFEST);
      manifest = getFile(KEY_APPDIR, 
                         [DIR_EXTENSIONS, parts[1], FILE_INSTALL_MANIFEST]);
    }
    switch (parts[0]) {
    case this.TOKEN_EXTENSION:
      this._manager.ensurePreConfiguredItem(parts[1], nsIUpdateItem.TYPE_EXTENSION, manifest);
      break;
    case this.TOKEN_THEME:
      this._manager.ensurePreConfiguredItem(parts[1], nsIUpdateItem.TYPE_THEME, manifest);
      break;
    }
  }
};

///////////////////////////////////////////////////////////////////////////////
//
// nsChromeRegistrationException
//
function nsChromeRegistrationException(aChromePath, aIsProfile, aFunctionName)
{
  this.chromePath = aChromePath;
  this.isProfile = aIsProfile;
  this.functionName = aFunctionName;
}
nsChromeRegistrationException.prototype = {
  chromePath      : null,
  isProfile       : true,
  functionName    : null,
  extensionID     : null
};

///////////////////////////////////////////////////////////////////////////////
//
// nsExtensionInstaller
//
function nsExtensionInstaller (aExtensionDS)
{
  this._extensionDS = aExtensionDS;

  this._provTypePackage = gRDF.GetResource(EM_NS("package"));
  this._provTypeSkin    = gRDF.GetResource(EM_NS("skin"));
  this._provTypeLocale  = gRDF.GetResource(EM_NS("locale"));
  this._fileProperty    = gRDF.GetResource(EM_NS("file"));
  this._sourceResource  = gRDF.GetResource("urn:mozilla:install-manifest");
}

nsExtensionInstaller.prototype = {
  // Utility services and helpers
  _rdf              : null,
  _writer           : null,

  // Extension metadata
  _extensionID      : null,
  _isProfile        : true,
  _extDirKey        : KEY_PROFILEDIR,
  
  // Source and target datasources
  _metadataDS       : null,
  _extensionDS      : null,
  
  // RDF objects and properties
  _provTypePackage  : null,
  _provTypeSkin     : null,
  _provTypeLocale   : null,
  _sourceResource   : null,
  _fileProperty     : null,
  
  install: function nsExtensionInstaller_install (aExtensionID, aIsProfile)
  {
    // Initialize the installer for this extension
    this._extensionID = aExtensionID;
    this._isProfile = aIsProfile;
    this._extDirKey = getDirKey(this._isProfile);

    // Create a logger to log install operations for uninstall
    this._writer = new nsInstallLogWriter(this._extensionID, this._isProfile);
    this._writer.open();
    
    // Move files from the staging dir into the extension's final home.
    // This function generates uninstall log files and creates backups of
    // existing files. 
    // XXXben - would like to add exception handling here to test for file
    //          I/O failures on uninstall log so that if there's a crash
    //          and the uninstall log is incorrectly/incompletely written 
    //          we can roll back. It's not critical that we do so right now
    //          since if this throws the extension's chrome is never 
    //          registered. 
    this._installExtensionFiles();
    
    // Load the metadata datasource
    var metadataFile = getFile(this._extDirKey, 
                               [DIR_EXTENSIONS, aExtensionID, FILE_INSTALL_MANIFEST]);
    
    this._metadataDS = getInstallManifest(metadataFile);
    if (!this._metadataDS) return;
    
    // Add metadata for the extension to the global extension metadata set
    this._extensionDS.addItemMetadata(this._extensionID, nsIUpdateItem.TYPE_EXTENSION, 
                                      this._metadataDS, this._isProfile);
    
    // Register chrome packages for files specified in the extension manifest
    try {
      this._registerChromeForExtension();
    }
    catch (e) {
      // Failed to register chrome, for any number of reasons - non-existent 
      // contents.rdf file at the location specified, malformed contents.rdf, 
      // etc. Set the "toBeUninstalled" flag so that the extension is uninstalled
      // properly during the subsequent uninstall pass in 
      // |nsExtensionManager::_finalizeOperations|

      this._extensionDS.setItemProperty(this._extensionID, 
                                        this._extensionDS._emR("toBeUninstalled"),
                                        this._extensionDS._emL("true"), this._isProfile,
                                        nsIUpdateItem.TYPE_EXTENSION);
      e.extensionID = this._extensionID;
      showMalformedRegistrationError(e);
    }
    
    this._writer.close();

    // Unset the "toBeInstalled" flag
    this._extensionDS.setItemProperty(this._extensionID, 
                                      this._extensionDS._emR("toBeInstalled"),
                                      null, this._isProfile,
                                      nsIUpdateItem.TYPE_EXTENSION);
  },
  
  _installExtensionFiles: function nsExtensionInstaller__installExtensionFiles ()
  {
    var sourceXPI = getFile(this._extDirKey, 
                            [DIR_EXTENSIONS, DIR_TEMP, 
                             this._extensionID, 
                             this._extensionID + ".xpi"]);
    var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"]
                              .createInstance(Components.interfaces.nsIZipReader);
    zipReader.init(sourceXPI);
    zipReader.open();

    var entries = zipReader.findEntries("*");
    while (entries.hasMoreElements()) {
      var entry = entries.getNext().QueryInterface(Components.interfaces.nsIZipEntry);
      
      var parts = entry.name.split("/");
      var subDirs = [DIR_EXTENSIONS, this._extensionID];
      for (var i = 0; i < parts.length; ++i)
        subDirs.push(parts[i]);
      
      var fileName = parts[parts.length-1];
      if (fileName != "") {
        var targetFile = getFile(this._extDirKey, subDirs);
        zipReader.extract(entry.name, targetFile);
        this._writer.addFile(targetFile.QueryInterface(Components.interfaces.nsILocalFile));
      }
    }
    zipReader.close();
    // Kick off the extraction on a new thread, then join to wait for it to
    // complete. 
    // (new nsJarFileExtractor(aZipReader.file, dir)).extract();
    
    this._cleanUpStagedXPI();
  },
  
  _cleanUpStagedXPI: function nsExtensionInstaller__cleanUpStagedXPI ()
  {
    var stageDir = getDir(this._extDirKey, 
                          [DIR_EXTENSIONS, DIR_TEMP, this._extensionID]);
    var sourceXPI = stageDir.clone();
    sourceXPI.append(this._extensionID + ".xpi");
    sourceXPI.remove(false);
    
    // Remove the extension's stage dir
    if (!stageDir.directoryEntries.hasMoreElements()) 
      stageDir.remove(false);
      
    // If the parent "temp" dir is empty, remove it.
    try { // XXXben
      if (!stageDir.parent.directoryEntries.hasMoreElements())
        stageDir.parent.remove(false);
    }
    catch (e) { }
  },
  
  _registerChromeForExtension: function nsExtensionInstaller__registerChromeForExtension ()
  {
    // Enumerate the metadata datasource files collection and register chrome
    // for each file, calling _registerChrome for each.
    var chromeDir = getDir(this._extDirKey, 
                           [DIR_EXTENSIONS, this._extensionID, DIR_CHROME]);
    
    var files = this._metadataDS.GetTargets(this._sourceResource, this._fileProperty, true);
    while (files.hasMoreElements()) {
      var file = files.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var chromeFile = chromeDir.clone();
      var fileName = file.Value.substr("urn:mozilla:extension:file:".length, file.Value.length);
      chromeFile.append(fileName);
      
      var providers = [this._provTypePackage, this._provTypeSkin, this._provTypeLocale];
      for (var i = 0; i < providers.length; ++i) {
        var items = this._metadataDS.GetTargets(file, providers[i], true);
        while (items.hasMoreElements()) {
          var item = items.getNext().QueryInterface(Components.interfaces.nsIRDFLiteral);
          this._registerChrome(chromeFile, providers[i], item.Value);
        }
      }
    }
  },
  
  _registerChrome: function nsExtensionInstaller__registerChrome (aFile, aChromeType, aPath)
  { 
    var fileURL = getURLSpecFromFile(aFile);
    if (!aFile.isDirectory()) // .jar files
      fileURL = "jar:" + fileURL + "!/" + aPath;
    else                      // flat chrome hierarchies
      fileURL = fileURL + aPath;
    
    var cr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                       .getService(Components.interfaces.nsIXULChromeRegistry);
    var type;
    if (aChromeType.EqualsNode(this._provTypePackage)) {
      try {
        cr.installPackage(fileURL, this._isProfile);
      }
      catch (e) {
        throw new nsChromeRegistrationException(fileURL, this._isProfile, "installPackage");
      }
      type = this._writer.CHROME_TYPE_PACKAGE;
    }
    else if (aChromeType.EqualsNode(this._provTypeSkin)) {
      try {
        cr.installSkin(fileURL, this._isProfile, true); // Extension skins can execute scripts
      }
      catch (e) {
        throw new nsChromeRegistrationException(fileURL, this._isProfile, "installSkin");
      }
      type = this._writer.CHROME_TYPE_SKIN;
    }
    else if (aChromeType.EqualsNode(this._provTypeLocale)) {
      try {
        cr.installLocale(fileURL, this._isProfile);
      }
      catch (e) {
        throw new nsChromeRegistrationException(fileURL, this._isProfile, "installLocale");
      }
      type = this._writer.CHROME_TYPE_LOCALE;
    }
    var providerNames = this._getProviderNames(fileURL, type);
    for (var i = 0; i < providerNames.length; ++i) {
      this._writer.registerChrome(providerNames[i], type, this._isProfile);
      
      // Make sure we enable overlays for this extension so that if it is disabled by
      // mismatch checking, installing a newer version (as opposed to enabling as a 
      // result of a version compatibility update) makes the extension's overlaid UI 
      // appear immediately.
      cr.setAllowOverlaysForPackage(providerNames[i], true);
    }
  },
  
  _getProviderNames: function nsExtensionInstaller__getProviderNames (aBaseURL, aType)
  {
    if (aBaseURL.charAt(aBaseURL.length-1) != "/")
      aBaseURL += "/";
    var manifestURL = aBaseURL + FILE_CHROME_MANIFEST;
    
    var providerNames = [];

    //~ try {
      // Discover the list of provider names to register for the location 
      // specified in the provider arc.
      //
      // The contents.rdf file will look like this:
      //
      //   <RDF:Seq about="urn:mozilla:<type>:root">
      //     <RDF:li resource="urn:mozilla:<type>:itemName1"/>
      //     <RDF:li resource="urn:mozilla:<type>:itemName2"/>
      //     ..
      //   </RDF:Seq>
      //
      // We need to explicitly walk this list here, we don't need to do so
      // for nsIXULChromeRegistry's |installPackage| method since that does
      // this same thing itself.
      //
      //XXXmotohiko:
      // Locale packs don't have contents.rdf on the root. They always registered
      // by directories.
      //   <RDF:Seq about="urn:mozilla:locale:root">
      //     <RDF:li resource="urn:mozilla:locale:<langcode>"/>
      //   </RDF:Seq>
      //   <RDF:Seq about="urn:mozilla:locale:<langcode>:packages">
      //     <RDF:li resource="urn:mozilla:locale:<langcode>:itemName1"/>
      //     <RDF:li resource="urn:mozilla:locale:<langcode>:itemName2"/>
      //     ..
      //   </RDF:Seq>
      //
      // So we check child nodes first
      
      var ds = gRDF.GetDataSourceBlocking(manifestURL);
      var ctr = Components.classes["@mozilla.org/rdf/container;1"]
                          .createInstance(Components.interfaces.nsIRDFContainer);
      ctr.Init(ds, gRDF.GetResource("urn:mozilla:" + aType + ":root"));
      if (!ctr) return providerNames;
      
      var nameArc = gRDF.GetResource(CHROME_NS("name"));
      var pkgArc = gRDF.GetResource(CHROME_NS("packages"));
      
      var items = ctr.GetElements();
      while (items.hasMoreElements()) {
        var item = items.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        // Check sub nodes when this is a locale
        if (aType == this._writer.CHROME_TYPE_LOCALE) {
          try {
            var pkgNode = ds.GetTarget(item, pkgArc, true);
            var pkgList = pkgNode.QueryInterface(Components.interfaces.nsIRDFResource);
            var pkgCtr = Components.classes["@mozilla.org/rdf/container;1"]
                                   .createInstance(Components.interfaces.nsIRDFContainer);
            pkgCtr.Init(ds, gRDF.GetResource(pkgList.Value));
            if (!pkgCtr) continue;
            
            var pkgItems = pkgCtr.GetElements();
            while (pkgItems.hasMoreElements()) {
              var pkgItem = pkgItems.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
              var name;
              if (ds.hasArcOut(pkgItem, nameArc))
                name = stringData(ds.GetTarget(pkgItem, nameArc, true));
              else
                name = pkgItem.Value.match(/^([^\:]*\:){3}(.*$)/)[2];
              providerNames.push(name);
            }
          } catch(e) {}
        } else {
          var name;
          if (ds.hasArcOut(item, nameArc))
            name = stringData(ds.GetTarget(item, nameArc, true));
          else
            name = item.Value.match(/^([^\:]*\:){3}(.*$)/)[2];
          providerNames.push(name);
        }
      }
//    }
//    catch (e) { }
    
    return providerNames;
  }
};

///////////////////////////////////////////////////////////////////////////////
//
// nsExtensionUninstaller
//
function nsExtensionUninstaller(aExtensionDS)
{
  this._cr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                       .getService(Components.interfaces.nsIXULChromeRegistry);
  this._extensionDS = aExtensionDS;
}

nsExtensionUninstaller.prototype = {
  _extensionDS  : null,
  _cr           : null,
  _isProfile    : true,
  _extDirKey    : "",
  _extensionsDir: null,
  _extensionID  : "",

  uninstall: function nsExtensionUninstaller_uninstall (aExtensionID, aIsProfile)
  {
    // Initialize the installer for this extension
    this._extensionID = aExtensionID;
    this._isProfile = aIsProfile;
    this._extDirKey = getDirKey(this._isProfile);
    this._extensionsDir = getDir(this._extDirKey, [DIR_EXTENSIONS]);

    // Create a logger to log install operations for uninstall
    this._reader = new nsInstallLogReader(this._extensionID, 
                                          this._isProfile, 
                                          this);
    try { // XXXben don't let errors stop us. 
      this._reader.read();
      
      // Now remove the uninstall log file. 
      this._removeFile(this._reader.uninstallLog);
    }
    catch (e) {
      dump("******* Failed to remove extension uninstall log, with exception = " + e + "\n");
    }
    
    // Unset the "toBeUninstalled" flag
    this._extensionDS.setItemProperty(this._extensionID, 
                                      this._extensionDS._emR("toBeUninstalled"),
                                      null, this._isProfile,
                                      nsIUpdateItem.TYPE_EXTENSION);
  },
  
  ///////////////////////////////////////////////////////////////////////////////
  // nsIInstallLogReaderListener
  onAddFile: function nsExtensionUninstaller_onAddFile (aFile)
  {
    this._removeFile(aFile);
  },
  
  _removeFile: function nsExtensionUninstaller__removeFile (aFile)
  {
    if (aFile.exists()) {
      aFile.remove(false);
      
      // Clean up the parent hierarchy if possible  
      var parent = aFile.parent;
      var e = parent.directoryEntries;
      if (!e.hasMoreElements() && 
          !parent.equals(this._extensionsDir)) // stop at the extensions dir
        this._removeFile(parent);
    }
  },
  
  _deselectLocaleForPackage: function nsExtensionUninstaller_deselectLocaleForPackage (aProviderName, aIsProfile)
  {
    // aProviderName is somthing like 'ja-JP:global'.
    //   <RDF:Seq RDF:about="urn:mozilla:locale:ja-JP:packages">
    //     <RDF:li RDF:resource="urn:mozilla:locale:ja-JP:global"/>
    //     <RDF:li RDF:resource="urn:mozilla:locale:ja-JP:mozapps"/>
    //         :
    //   </RDF:Seq>
    //         :
    //   <RDF:Description RDF:about="urn:mozilla:locale:ja-JP:global">
    //         :
    //   </RDF:Description>
    var lang = aProviderName.match(/^([^:]*):(.+)?$/)[1];
    if (!lang) return;
    
    var dir = Components.classes['@mozilla.org/file/directory_service;1']
                        .getService(Components.interfaces.nsIProperties)
                        .get(aIsProfile ? KEY_PROFILECHROMEDIR : KEY_APPCHROMEDIR,
                             Components.interfaces.nsIFile);
    var path = Components.classes["@mozilla.org/network/io-service;1"]
                         .getService(Components.interfaces.nsIIOService)
                         .newFileURI(dir).spec;
    var ds = gRDF.GetDataSourceBlocking(path + FILE_CR_CHROMEDS)
                 .QueryInterface(Components.interfaces.nsIRDFDataSource);
    var ctr = Components.classes["@mozilla.org/rdf/container;1"]
                        .createInstance(Components.interfaces.nsIRDFContainer);
    // XXX CHROME_NS("packages")
    ctr.Init(ds, gRDF.GetResource("urn:mozilla:locale:" + lang + ":packages"));
    
    var providerArc = gRDF.GetResource("urn:mozilla:locale:" + aProviderName);
    if (ctr && ctr.IndexOf(providerArc) != -1) {
      // Remove outward arcs
      var arcs = ds.ArcLabelsOut(providerArc);
      while (arcs.hasMoreElements()) {
        var arc = arcs.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        var value = ds.GetTarget(providerArc, arc, true);
        if (value)
          ds.Unassert(providerArc, arc, value);
      }
      // Remove from packages node
      ctr.RemoveElement(providerArc, true);
      // Flush datasource
      ds.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource).Flush();
    }
  },
  
  // XXXben - maybe we should find a way to 
  _packagesForExtension: [],
  
  onRegisterChrome: function nsExtensionUninstaller_onRegisterChrome (aProviderName, aFile, aChromeType, aIsProfile)
  {
    switch (aChromeType) {
    case this._reader.CHROME_TYPE_PACKAGE:
      this._packagesForExtension.push(aProviderName);
      this._cr.uninstallPackage(aProviderName, aIsProfile)
      break;
    case this._reader.CHROME_TYPE_SKIN:
      for (var i = 0; i < this._packagesForExtension.length; ++i) {
        this._cr.deselectSkinForPackage(aProviderName, 
                                        this._packagesForExtension[i], 
                                        aIsProfile);
      }
      // this._cr.uninstallSkin(aProviderName, aIsProfile)
      break;
    case this._reader.CHROME_TYPE_LOCALE:
      this._deselectLocaleForPackage(aProviderName, 
                                     // aProviderName contains package name
                                     aIsProfile);
      // this._cr.uninstallLocale(aProviderName, aIsProfile)
      break;
    }
  }
};

///////////////////////////////////////////////////////////////////////////////
//
// nsExtensionEnabler
//
function nsExtensionEnabler(aExtensionDS)
{
  this._cr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                       .getService(Components.interfaces.nsIXULChromeRegistry);
  this._extensionDS = aExtensionDS;
}

nsExtensionEnabler.prototype = {
  _extensionDS  : null,
  _cr           : null,
  _enable       : true,
  _isProfile    : true,
  _extDirKey    : "",
  _extensionsDir: null,

  enable: function nsExtensionEnabler_enable (aExtensionID, aIsProfile, aDisable)
  {
    // Initialize the installer for this extension
    this._enable = !aDisable;
    this._extensionID = aExtensionID;
    this._isProfile = aIsProfile;
    this._extDirKey = getDirKey(this._isProfile);
    this._extensionsDir = getDir(this._extDirKey, [DIR_EXTENSIONS]);

    // Create a logger to log install operations for uninstall
    this._reader = new nsInstallLogReader(this._extensionID, 
                                          this._isProfile, 
                                          this);
    this._reader.read();
  },
  
  onRegisterChrome: function nsExtensionEnabler_onRegisterChrome (aProviderName, aFile, aChromeType, aIsProfile)
  {
    if (aChromeType == this._reader.CHROME_TYPE_PACKAGE)
      this._cr.setAllowOverlaysForPackage(aProviderName, this._enable);
  },
  
  onAddFile: function nsExtensionEnabler_onAddFile (aFile)
  {
  }
};

///////////////////////////////////////////////////////////////////////////////
//
// nsThemeInstaller
//
function nsThemeInstaller(aExtensionDS, aManager)
{
  this._extensionDS = aExtensionDS;
  this._em = aManager;
}

nsThemeInstaller.prototype = {
  _extensionDS  : null,
  _isProfile    : true,
  _extDirKey    : "",

  install: function nsThemeInstaller_install (aJARFile, aIsProfile)
  {
    var extDirKey = getDirKey(aIsProfile);

    // Since we're installing a "new type" theme, we assume a file layout
    // within the JAR like so:
    // foo.jar/
    //         install.rdf      <-- Theme Manager metadata
    //         contents.rdf   <-- Chrome Registry metadata
    //         browser/
    //         global/
    //         ...
    var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"]
                              .createInstance(Components.interfaces.nsIZipReader);
    zipReader.init(aJARFile);
    zipReader.open();
    
    try {
      zipReader.getEntry(FILE_INSTALL_MANIFEST);
    }
    catch (e) {
      // If the zip reader returned an error code here it means that the install.rdf
      // file was not found in the theme jar file - i.e. it was an old style theme. 
      // There's no reason for people to be installing or maintaining such themes 
      // anymore as there is no practical use for them, so we should throw an error
      // here and bail. 
      try {
        zipReader.getEntry(FILE_CHROME_MANIFEST);
        
        // Load the contents.rdf file from the .jar file if present and show a detailed
        // error.         
        var tempChromeManifest = getFile(extDirKey,
                                         [DIR_EXTENSIONS, DIR_TEMP, FILE_CHROME_MANIFEST]);
        zipReader.extract(FILE_CHROME_MANIFEST, tempChromeManifest);
        var rdfs = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                             .getService(Components.interfaces.nsIRDFService);
        showOldThemeError(rdfs.GetDataSourceBlocking(getURLSpecFromFile(tempChromeManifest)));
        tempChromeManifest.remove(false);
      }
      catch (e) {
        showMissingFileError(aJARFile, FILE_CHROME_MANIFEST);
      }
    }
    
    var themeManifest = getFile(extDirKey,
                                [DIR_EXTENSIONS, DIR_TEMP, getRandomFileName("install", "rdf")]);
    zipReader.extract(FILE_INSTALL_MANIFEST, themeManifest);
    
    var chromeManifest = getFile(extDirKey,
                                 [DIR_EXTENSIONS, DIR_TEMP, FILE_CHROME_MANIFEST]);
    zipReader.extract(FILE_CHROME_MANIFEST, chromeManifest);
    
    var themeMetadata = getInstallManifest(themeManifest);
    if (!themeMetadata) return;
    var chromeMetadata = gRDF.GetDataSourceBlocking(getURLSpecFromFile(chromeManifest));
    
    // We do a basic version check first just to make sure we somehow weren't 
    // tricked into installing an incompatible theme...
    this._themeID = this._em.canInstallItem(themeMetadata);
    if (isNaN(parseInt(this._themeID))) {
      var canInstall = true;

      // Copy the file to its final location
      var destinationDir = getDir(extDirKey, 
                                  [DIR_EXTENSIONS, this._themeID, DIR_CHROME]);
      var destinationFile = destinationDir.clone();
      destinationFile.append(aJARFile.leafName);
      if (destinationFile.exists())
        destinationFile.remove(false);
      aJARFile.copyTo(destinationDir, aJARFile.leafName);

      var nameArc = gRDF.GetResource(CHROME_NS("name"));
      var ctr = Components.classes["@mozilla.org/rdf/container;1"]
                          .createInstance(Components.interfaces.nsIRDFContainer);
      ctr.Init(chromeMetadata, gRDF.GetResource("urn:mozilla:skin:root"));
      
      var elts = ctr.GetElements();
      while (elts.hasMoreElements()) {
        var elt = elts.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        var chromeSkinPrefix = "urn:mozilla:skin:";
        if (elt.Value.substr(0, chromeSkinPrefix.length) == chromeSkinPrefix) {
          var name = chromeMetadata.GetTarget(elt, nameArc, true);
          
          // Check to see if the em:internalName property on the theme install
          // manifest matches the chrome:name property on the theme's CR entry. 
          var manifestRoot = gRDF.GetResource("urn:mozilla:install-manifest");
          var internalName = themeMetadata.GetTarget(manifestRoot, 
                                                     gRDF.GetResource(EM_NS("internalName")),
                                                     true);
          if (!internalName.EqualsNode(name)) {
            var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                           .getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage("Could not install theme because chrome:name arc in " +
                                            "the theme's contents.rdf file (" + stringData(name) +
                                            ") does not match the em:internalName arc in the theme's " + 
                                            "install.rdf file (" + stringData(internalName) + ")");
            var fileURL = getURLSpecFromFile(themeManifest);
            var uri = Components.classes["@mozilla.org/network/standard-url;1"]
                                .createInstance(Components.interfaces.nsIURI);
            uri.spec = fileURL;
            var url = uri.QueryInterface(Components.interfaces.nsIURL);
            showMalformedError(url.fileName);
            
            destinationFile.remove(false);
            destinationDir.remove(true);
            this._em._cleanDirs();
            
            canInstall = false;
          }

          if (canInstall) {
            name = name.QueryInterface(Components.interfaces.nsIRDFLiteral).Value;

            // Create a logger to log install operations for uninstall
            this._writer = new nsInstallLogWriter(this._themeID, aIsProfile);
            this._writer.open();
            this._writer.installSkin(name, aIsProfile);
          }
        }
      }

      if (canInstall) {
        this._writer.addFile(destinationFile.QueryInterface(Components.interfaces.nsILocalFile));
        this._writer.close();

        // Use the Chrome Registry API to install the theme there
        var filePath = "jar:" + getURLSpecFromFile(destinationFile) + "!/";      
        var cr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                          .getService(Components.interfaces.nsIXULChromeRegistry);
        cr.installSkin(filePath, aIsProfile, false);

        // Insert the theme into the theme list. 
        this._extensionDS.insertForthcomingItem(this._themeID, nsIUpdateItem.TYPE_THEME, 
                                                aIsProfile);

        // Add metadata for the extension to the global extension metadata set
        this._extensionDS.addItemMetadata(this._themeID, nsIUpdateItem.TYPE_THEME,
                                          themeMetadata, aIsProfile);
      }
      
      this._extensionDS.doneInstallingTheme(this._themeID);
    }
    else if (this._themeID == 0)
      showIncompatibleError(themeMetadata);
    
    zipReader.close();
    themeManifest.remove(false);
    chromeManifest.remove(false);
  }
};

///////////////////////////////////////////////////////////////////////////////
//
// nsThemeUninstaller
//
function nsThemeUninstaller(aExtensionDS)
{
  this._cr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                       .getService(Components.interfaces.nsIXULChromeRegistry);
}

nsThemeUninstaller.prototype = {
  _extensionsDir : null,
  
  uninstall: function nsThemeUninstaller_uninstall (aThemeID, aIsProfile)
  {
    this._extensionsDir = getDir(getDirKey(aIsProfile), [DIR_EXTENSIONS]);

    // Create a logger to log install operations for uninstall
    this._reader = new nsInstallLogReader(aThemeID, aIsProfile, this);
    try { // XXXben don't let errors stop us. 
      this._reader.read();
      
      // Now remove the uninstall log file. 
      this._removeFile(this._reader.uninstallLog);
    }
    catch (e) {
      dump("******* Failed to remove theme uninstall log, with exception = " + e + "\n");
    }
  },
  
  ///////////////////////////////////////////////////////////////////////////////
  // nsIInstallLogReaderListener
  onAddFile: function nsThemeUninstaller_onAddFile (aFile)
  {
    this._removeFile(aFile);
  },
  
  _removeFile: function nsThemeUninstaller__removeFile (aFile)
  {
    if (aFile.exists()) {
      aFile.remove(false);
      
      // Clean up the parent hierarchy if possible  
      var parent = aFile.parent;
      var e = parent.directoryEntries;
      if (!e.hasMoreElements() && 
          !parent.equals(this._extensionsDir)) // stop at the extensions dir
        this._removeFile(parent);
    }
  },
  
  onInstallSkin: function nsThemeUninstaller_onInstallSkin (aSkinName, aIsProfile)
  {
    this._cr.uninstallSkin(aSkinName, aIsProfile);
  }
};

///////////////////////////////////////////////////////////////////////////////
//
// nsExtensionManager
//
function nsExtensionManager()
{
  gPref = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch);
  gRDF = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                   .getService(Components.interfaces.nsIRDFService);
  gOS = Components.classes["@mozilla.org/observer-service;1"]
                  .getService(Components.interfaces.nsIObserverService);

  gOS.addObserver(this, "xpcom-shutdown", false);

  ensureExtensionsFiles(false);
}

nsExtensionManager.prototype = {
  _extInstaller     : null,
  _extUninstaller   : null,
  _extEnabler       : null,
  _started          : false,
  
  /////////////////////////////////////////////////////////////////////////////
  // nsIObserver
  observe: function nsExtensionManager_observe (aSubject, aTopic, aData)
  {
    switch (aTopic) {
    case "quit-application-requested":
      if (this._downloadCount > 0) {
        var result;
        result = this._confirmCancelDownloads(this._downloadCount, 
                                              "quitCancelDownloadsAlertTitle",
                                              "quitCancelDownloadsAlertMsgMultiple",
                                              "quitCancelDownloadsAlertMsg",
                                              "dontQuitButtonWin");
        if (!result)
          this._cancelDownloads();
        var PRBool = aSubject.QueryInterface(Components.interfaces.nsISupportsPRBool);
        PRBool.data = result;
      }
      break;
    case "offline-requested":
      if (this._downloadCount > 0) {
        result = this._confirmCancelDownloads(this._downloadCount,
                                              "offlineCancelDownloadsAlertTitle",
                                              "offlineCancelDownloadsAlertMsgMultiple",
                                              "offlineCancelDownloadsAlertMsg",
                                              "dontGoOfflineButton");
        if (!result)
          this._cancelDownloads();
        var PRBool = aSubject.QueryInterface(Components.interfaces.nsISupportsPRBool);
        PRBool.data = result;
      }
      break;  
    case "xpcom-shutdown":
      gOS.removeObserver(this, "xpcom-shutdown");    

      // Release strongly held services.
      gPref           = null;
      gRDF            = null;
      gOS             = null;
      gVersionChecker = null;
      break;
    }
  },
  
  start: function nsExtensionManager_start (aIsDirty)
  {
    this._started = true;
    
    var needsRestart = false;
  
    ensureExtensionsFiles(true);
    
    // Somehow the component list went away, and for that reason the new one
    // generated by this function is going to result in a different compreg.
    // We must force a restart.
    var componentList = getFile(KEY_PROFILEDIR, [FILE_COMPONENT_MANIFEST]);
    if (!componentList.exists())
      needsRestart = true;
    
    // XXXben - a bit of a hack - clean up any empty dirs that may not have been
    //          properly removed by [un]install... I should really investigate those
    //          cases to see what is stopping these dirs from being removed, but no
    //          time now.
    this._cleanDirs();
  
    var cmdLineSvc = Components.classes["@mozilla.org/appshell/commandLineService;1"]
                                .getService(Components.interfaces.nsICmdLineService);
    var safeMode = cmdLineSvc.getCmdLineValue("-safe-mode") != null;
    if (!safeMode) {
      var wasInSafeModeFile = getFile(KEY_PROFILEDIR, [DIR_EXTENSIONS, FILE_WASINSAFEMODE]);
      if (wasInSafeModeFile.exists()) {
        // Clean up after we were in safe mode
        var win = this._showProgressWindow();
        try {
          this._ensureDS();
          
          // Retrieve the skin that was selected prior to entering safe mode
          // and select it. 
          var lastSelectedSkin = KEY_DEFAULT_THEME;
          try {
            lastSelectedSkin = gPref.getCharPref(PREF_EM_LAST_SELECTED_SKIN);
            gPref.clearUserPref(PREF_EM_LAST_SELECTED_SKIN);
            gPref.setCharPref(PREF_GENERAL_SKINS_SELECTEDSKIN, lastSelectedSkin);
          } 
          catch (e) { }
          
          // Walk the list of extensions and re-activate overlays for packages 
          // that aren't disabled.
          var items = this._ds.getItemsWithFlagUnset("disabled", nsIUpdateItem.TYPE_EXTENSION);
          for (var i = 0; i < items.length; ++i)
            this._finalizeEnableDisable(items[i], false);
            
          wasInSafeModeFile.remove(false);
          
          this._writeDefaults(true);
          try {
            this._writeDefaults(false);
          }
          catch (e) { }
        }
        catch (e) {
          // dump("*** nsExtensionManager::start - failure, catching exception so finalize window can close = " + e + "\n");
        }
        win.close();
        
        needsRestart = true;
      }

      if (aIsDirty) 
        needsRestart = this._finishOperations();
    }
    else {
      var win = this._showProgressWindow();
      try {    
        // Enter safe mode
        this._ensureDS();

        // Save the current theme (assumed to be the theme that styles the global
        // package) and re-select the default theme ("classic/1.0")
        if (!gPref.prefHasUserValue(PREF_EM_LAST_SELECTED_SKIN)) {
          gPref.setCharPref(PREF_EM_LAST_SELECTED_SKIN,
                            gPref.getCharPref(PREF_GENERAL_SKINS_SELECTEDSKIN));
          if (gPref.prefHasUserValue(PREF_GENERAL_SKINS_SELECTEDSKIN))
            gPref.clearUserPref(PREF_GENERAL_SKINS_SELECTEDSKIN);
        }

        var items = this._ds.getItemList(null, nsIUpdateItem.TYPE_EXTENSION, {});
        for (var i = 0; i < items.length; ++i)
          this._finalizeEnableDisable(items[i].id, true);
          
        this._ds.safeMode = true;
        
        this._writeDefaults(true);
        try {
          this._writeDefaults(false);
        }
        catch (e) { }

        needsRestart = true;

        var wasInSafeModeFile = getFile(KEY_PROFILEDIR, [DIR_EXTENSIONS, FILE_WASINSAFEMODE]);
        if (!wasInSafeModeFile.exists())
          wasInSafeModeFile.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0644);
        else {
          // If the "Safe Mode" file already exists, then we are in the second launch of an
          // app launched with -safe-mode and so we don't want to provoke any further
          // restarts or re-create the file, just continue starting normally.
          needsRestart = false;
        }
      }
      catch (e) {
        dump("*** nsExtensionManager::start - (safe mode) failure, catching exception so finalize window can close = " + e + "\n");
      }
      win.close();
      
    }
    return needsRestart;
  },
  
  handleCommandLineArgs: function nsExtensionManager_handleCommandLineArgs ()
  {
    var cmdLineSvc = Components.classes["@mozilla.org/appshell/commandLineService;1"]
                              .getService(Components.interfaces.nsICmdLineService);
    var globalExtension = cmdLineSvc.getCmdLineValue("-install-global-extension");
    if (globalExtension)
      this._checkForGlobalInstalls(globalExtension, nsIUpdateItem.TYPE_EXTENSION);
      
    var globalTheme = cmdLineSvc.getCmdLineValue("-install-global-theme");
    if (globalTheme)
      this._checkForGlobalInstalls(globalTheme, nsIUpdateItem.TYPE_THEME);
    
    var showList = cmdLineSvc.getCmdLineValue("-list-global-items");
    if (showList)
      this._showGlobalItemList();
      
    var locked = cmdLineSvc.getCmdLineValue("-lock-item");
    if (locked) {
      this._ensureDS();
      this._ds.lockUnlockItem(locked, true);
    }

    var unlocked = cmdLineSvc.getCmdLineValue("-unlock-item");
    if (unlocked) {
      this._ensureDS();
      this._ds.lockUnlockItem(unlocked, false);
    }
    
    this._finishOperations();
  },
  
  register: function nsExtensionManager_register ()
  {
    if (!this._started) {
      // Loads the datasource and installs any pre-configured items.
      this._ds = new nsExtensionsDataSource();
      this._ds.loadExtensions(false);
      
      // Write bin/extensions/Extensions.rdf
      //       bin/extensions/installed-extensions-processed.txt
      (new nsInstalledExtensionReader(this)).read();

      // Write bin/components.ini
      var manifest = getFile(KEY_APPDIR, [FILE_COMPONENT_MANIFEST]);
      this._writeProfileFile(manifest, this._getComponentsDir, false);
    }
  },

  _cancelDownloads: function nsExtensionManager__cancelDownloads ()
  {
    for (var i = 0; i < this._transactions.length; ++i)
      gOS.notifyObservers(this._transactions[i], "xpinstall-progress", "cancel");
    gOS.removeObserver(this, "offline-requested");
    gOS.removeObserver(this, "quit-application-requested");

    this._removeAllDownloads();
  },

  _confirmCancelDownloads: function nsExtensionManager__confirmCancelDownloads(aCount, 
    aTitle, aCancelMessageMultiple, aCancelMessageSingle, aDontCancelButton)
  {
    var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                        .getService(Components.interfaces.nsIStringBundleService);
    var bundle = sbs.createBundle("chrome://mozapps/locale/downloads/downloads.properties");
    var title = bundle.GetStringFromName(aTitle);
    var message, quitButton;
    if (aCount > 1) {
      message = bundle.formatStringFromName(aCancelMessageMultiple, [aCount], 1);
      quitButton = bundle.formatStringFromName("cancelDownloadsOKTextMultiple", [aCount], 1);
    }
    else {
      message = bundle.GetStringFromName(aCancelMessageSingle);
      quitButton = bundle.GetStringFromName("cancelDownloadsOKText");
    }
    var dontQuitButton = bundle.GetStringFromName(aDontCancelButton);
    
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                       .getService(Components.interfaces.nsIWindowMediator);
    var win = wm.getMostRecentWindow("Extension:Manager");
    const nsIPromptService = Components.interfaces.nsIPromptService;
    var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                       .getService(nsIPromptService);
    var flags = (nsIPromptService.BUTTON_TITLE_IS_STRING * nsIPromptService.BUTTON_POS_0) +
                (nsIPromptService.BUTTON_TITLE_IS_STRING * nsIPromptService.BUTTON_POS_1);
    var rv = ps.confirmEx(win, title, message, flags, quitButton, dontQuitButton, null, null, { });
    return rv == 1;
  },
  
  // This function checks for and disables any "old-style" extensions 
  // from Firefox 0.8 and earlier created using the "chrome:extension=true" flag. 
  _disableObsoleteExtensions: function nsExtensionManager__disableObsoleteExtensions ()
  {
    if (!gPref.prefHasUserValue(PREF_EM_DISABLEDOBSOLETE) || !gPref.getBoolPref(PREF_EM_DISABLEDOBSOLETE)) {
      var win = this._showProgressWindow();
      try {
        var cr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                          .getService(Components.interfaces.nsIXULChromeRegistry);
        var crDS = gRDF.GetDataSource("rdf:chrome");
        var disabled = false;
        var sources = crDS.GetSources(gRDF.GetResource(CHROME_NS("extension")), gRDF.GetLiteral("true"), true);
        while (sources.hasMoreElements()) {
          disabled = true;
          
          var source = sources.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
          var name = crDS.GetTarget(source, gRDF.GetResource(CHROME_NS("name")), true);
          if (name) {
            name = name.QueryInterface(Components.interfaces.nsIRDFLiteral).Value;
            cr.setAllowOverlaysForPackage(name, false);
          }
        }

        // Re-select the default theme to prevent any incompatibilities with old-style
        // themes.
        cr.selectSkin(KEY_DEFAULT_THEME, true);
      }
      catch (e) {
        // dump("*** nsExtensionManager::_disableObsoleteExtensions - failure, catching exception so finalize window can close\n");
      }
      win.close();
      
      if (disabled) {
        const nsIPromptService = Components.interfaces.nsIPromptService;
        var ps = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                           .getService(nsIPromptService);
        var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                            .getService(Components.interfaces.nsIStringBundleService);
        var bundle = sbs.createBundle("chrome://mozapps/locale/extensions/extensions.properties");
        var title = bundle.GetStringFromName("disabledObsoleteTitle");
        var message = bundle.GetStringFromName("disabledObsoleteMessage");
        // ps.alert(null, title, message);
      }
            
      gPref.setBoolPref(PREF_EM_DISABLEDOBSOLETE, true);
    }
  },
  
  _checkForGlobalInstalls: function nsExtensionManager__checkForGlobalInstalls (aPath, aItemType)
  {
    try {
      var ioServ = Components.classes["@mozilla.org/network/io-service;1"]
                             .getService(Components.interfaces.nsIIOService);
      var uri = ioServ.newURI(aPath, null, null);  
      aPath = uri.path;
    }
    catch (e) { } 

    // First see if the path supplied is a file path
    var file = Components.classes["@mozilla.org/file/local;1"]
                         .createInstance(Components.interfaces.nsILocalFile);
    try {
      file.initWithPath(aPath);
    }
    catch (e) {
      // Try appending the path to the current proc dir. 
      file = getDir(KEY_APPDIR, []);
      try {
        file.append(aPath);
      }
      catch (e) { /* can't handle this */ }
    }
    
    if (file.exists()) {
      if (aItemType & nsIUpdateItem.TYPE_EXTENSION)
        this.installExtension(file, nsIExtensionManager.FLAG_INSTALL_GLOBAL);
      else if (aItemType & nsIUpdateItem.TYPE_THEME)
        this.installTheme(file, nsIExtensionManager.FLAG_INSTALL_GLOBAL);
    }
    else
      dump("Invalid XPI/JAR Path: " + aPath + "\n");
  },
  
  _showGlobalItemList: function nsExtensionManager__showGlobalItemList ()
  {
    this._ensureDS();
    
    var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                        .getService(Components.interfaces.nsIStringBundleService);
    var bundle = sbs.createBundle("chrome://mozapps/locale/extensions/extensions.properties");

    dump(bundle.GetStringFromName("globalItemList"));
    dump(bundle.GetStringFromName("globalItemListExtensions"));
    var items = this.getItemList(null, nsIUpdateItem.TYPE_EXTENSION, {});
    for (var i = 0; i < items.length; ++i)
      dump(" " + items[i].id + "   " + items[i].name + " " + items[i].version + "\n");
    dump(bundle.GetStringFromName("globalItemListThemes"));
    items = this.getItemList(null, nsIUpdateItem.TYPE_THEME, {});
    for (var i = 0; i < items.length; ++i)
      dump(" " + items[i].id + "   " + items[i].name + " " + items[i].version + "\n");
      
    dump("\n\n");
  },
  
  _finishOperations: function nsExtensionManager__finishOperations ()
  {
    var win = this._showProgressWindow();
  
    try {
      // An existing autoreg file is an indication that something major has 
      // happened to the extensions datasource (install/uninstall/enable/disable)
      // and as such we must load it now and see what needs to happen.
      this._ensureDS();
      
      // Look for items that need to be installed
      var items = this._ds.getItemsWithFlagSet("toBeInstalled");
      for (var i = 0; i < items.length; ++i)
        this._finalizeInstall(items[i]);

      // If there were any install operations, we need to restart (again!) after 
      // the component files have been properly installed are registered...
      var needsRestart = items.length > 0;
      
      // Look for extensions that need to be enabled
      items = this._ds.getItemsWithFlagSet("toBeEnabled");
      for (var i = 0; i < items.length; ++i)
        this._finalizeEnableDisable(items[i], false);
      
      // Look for extensions that need to be disabled
      items = this._ds.getItemsWithFlagSet("toBeDisabled");
      for (var i = 0; i < items.length; ++i)
        this._finalizeEnableDisable(items[i], true);
      
      // Look for extensions that need to be removed. This MUST be done after
      // the install operations since extensions to be installed may have to be
      // uninstalled if there are errors during the installation process!
      items = this._ds.getItemsWithFlagSet("toBeUninstalled");
      for (var i = 0; i < items.length; ++i)
        this._finalizeUninstall(items[i]);
      
      // If there were any install operations, we need to restart (again!) after 
      // the component files have been properly uninstalled are unregistered...
      needsRestart = needsRestart | (items.length > 0);
      
      // Clean up any helper objects
      delete this._extInstaller;
      delete this._extUninstaller;
      delete this._extEnabler;
      
      this._updateManifests();
      // If no additional restart is required, it implies that there are
      // no new components that need registering so we can inform the app
      // not to do any extra startup checking next time round.    
      this._writeCompatibilityManifest(needsRestart);
    }
    catch (e) {
      // dump("*** nsExtensionManager::_finishOperations - failure, catching exception so finalize window can close " + e +"\n");
    }
    win.close();
    
    return needsRestart;
  },
  
  // XXXben - this is actually a cheap stunt to load all the chrome registry 
  //          services required to register/unregister packages... the synchronous
  //          nature of this code ensures the window will never actually appear
  //          on screen. 
  _showProgressWindow: function nsExtensionManager__showProgressWindow ()
  {
    var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                       .getService(Components.interfaces.nsIWindowWatcher);
    return ww.openWindow(null, "chrome://mozapps/content/extensions/finalize.xul", 
                         "", "chrome,centerscreen,dialog", null);
  },
  
  _loadDefaults: function nsExtensionManager__loadDefaults ()
  {
    // Load default preferences files for all extensions
    var defaultsManifest = getFile(KEY_PROFILEDIR, 
                                   [DIR_EXTENSIONS, FILE_DEFAULTS]);
    if (defaultsManifest.exists()) {
      var fis = Components.classes["@mozilla.org/network/file-input-stream;1"]
                          .createInstance(Components.interfaces.nsIFileInputStream);
      fis.init(defaultsManifest, -1, -1, false);
      var lis = fis.QueryInterface(Components.interfaces.nsILineInputStream);
      var line = { value: "" };
      var more = false;
      do {
        more = lis.readLine(line);
        var lf = Components.classes["@mozilla.org/file/local;1"]
                            .createInstance(Components.interfaces.nsILocalFile);
        var path = line.value;
        if (path) {
          lf.initWithPath(path);
          
          if (lf.exists())
            gPref.readUserPrefs(lf);
        }
      }
      while (more);
      fis.close();
    }
  },
  
  ensurePreConfiguredItem: function nsExtensionManager_ensurePreConfiguredItem (aItemID, aItemType, aManifest)
  {
    this._ds.insertForthcomingItem(aItemID, aItemType, false);
    var metadataDS = getInstallManifest(aManifest);
    this._ds.addItemMetadata(aItemID, aItemType, metadataDS, false);
  },
  
  checkForMismatches: function nsExtensionManager_checkForMismatches () 
  {
    var needsRestart = false;
        
    this._disableObsoleteExtensions();

    // Check to see if the version of the application that is being started
    // now is the same one that was started last time. 
    var currAppVersion = gPref.getCharPref(PREF_EM_APP_EXTENSIONS_VERSION);
    try {
      var lastAppVersion = gPref.getCharPref(PREF_EM_LAST_APP_VERSION);
    }
    catch (e) {}
    if (currAppVersion != lastAppVersion) {
      // Version mismatch, we're have to load the extensions datasource
      // and do version checking. Time hit here doesn't matter since this 
      // doesn't happen all that often.
      this._ensureDS();
      var currAppID = gPref.getCharPref(PREF_EM_APP_ID);
      var items = this._ds.getIncompatibleItemList(currAppID, currAppVersion,
                                                   nsIUpdateItem.TYPE_ADDON);
      if (items.length > 0) {
        for (var i = 0; i < items.length; ++i) {
          // Now disable the extension so it won't hurt anything. 
          var itemType = getItemType(this._ds._getResourceForItem(items[i].id).Value);
          if (itemType != -1 && itemType & nsIUpdateItem.TYPE_EXTENSION)
            this.disableExtension(items[i].id);
          else if (itemType & nsIUpdateItem.TYPE_THEME) {
            if (gPref.prefHasUserValue(PREF_GENERAL_SKINS_SELECTEDSKIN))
              gPref.clearUserPref(PREF_GENERAL_SKINS_SELECTEDSKIN);
            this._ds.disableTheme(items[i].id);
          }
        }
        var updates = Components.classes["@mozilla.org/updates/update-service;1"]
                                .getService(Components.interfaces.nsIUpdateService);
        updates.checkForUpdates(items, items.length, nsIUpdateItem.TYPE_ADDON, 
                                nsIUpdateService.SOURCE_EVENT_MISMATCH,
                                null);
        
        needsRestart = true;
      }
    }
    
    // Somehow the component list went away, and for that reason the new one
    // generated by this function is going to result in a different compreg.
    // We must force a restart.
    var componentList = getFile(KEY_PROFILEDIR, [FILE_COMPONENT_MANIFEST]);
    if (!componentList.exists())
      needsRestart = true;
    
    // Now update the last app version so we don't do this checking 
    // again. 
    gPref.setCharPref(PREF_EM_LAST_APP_VERSION, currAppVersion);

    // XXXben - I am not entirely sure this is needed, since components and 
    // defaults manifests are written by the disabling function. Not going to
    // rock the boat now however. 
    this._updateManifests();
    
    return needsRestart;
  },
  
  get inSafeMode() 
  {
    return this._ds.safeMode;
  },
  
  _updateManifests: function nsExtensionManager__updateManifests ()
  {
    // Update the components manifests with paths for compatible, enabled, 
    // extensions.
    try {
      // Wrap this in try..catch so that if the account is restricted we don't
      // completely fail here for lack of permissions to write to the bin
      // dir (and cause apprunner to go into a restart loop). 
      //
      // This means that making changes to install-dir extensions only possible
      // for people with write access to bin dir (i.e. uninstall, disable, 
      // enable)
      this._writeComponentManifest(false);
      this._writeDefaults(false);
    }
    catch (e) { 
      // dump("*** ExtensionManager:_updateManifests: no access privileges to application directory, skipping.\n"); 
    };
    this._writeComponentManifest(true);
    this._writeDefaults(true);
  },
  
  // XXXben write to temporary file then move to final when done.
  _writeProfileFile: function nsExtensionManager__writeProfileFile (aFile, aGetDirFunc, aIsProfile)
  {
    // When an operation is performed that requires a component re-registration
    // (extension enabled/disabled, installed, uninstalled), we must write the
    // set of registry-relative paths of components to register to an .autoreg 
    // file which lives in the profile folder. 
    //
    // To do this we must enumerate all installed extensions and write data 
    // about all valid items to the file. 
    this._ensureDS();
    
    var fos = Components.classes["@mozilla.org/network/file-output-stream;1"]
                        .createInstance(Components.interfaces.nsIFileOutputStream);
    const MODE_WRONLY   = 0x02;
    const MODE_CREATE   = 0x08;
    const MODE_TRUNCATE = 0x20;
    fos.init(aFile, MODE_WRONLY | MODE_CREATE | MODE_TRUNCATE, 0644, 0);

    var extensions = this.getItemList(null, nsIUpdateItem.TYPE_EXTENSION, { });
    var validExtensions = [];
    for (var i = 0; i < extensions.length; ++i) {
      var extension = extensions[i];
    
      // An extension entry is valid only if it is not disabled, not about to 
      // be disabled, and not about to be uninstalled.
      var toBeDisabled = this._ds.getItemProperty(extension.id, "toBeDisabled");
      var toBeUninstalled = this._ds.getItemProperty(extension.id, "toBeUninstalled");
      var toBeInstalled = this._ds.getItemProperty(extension.id, "toBeInstalled");
      var disabled = this._ds.getItemProperty(extension.id, "disabled");
      if (toBeDisabled == "true" || toBeUninstalled == "true" || 
          disabled == "true" || toBeInstalled == "true")
        continue;
      
      var isProfile = this._ds.isProfileItem(extension.id);
      var sourceDir = aGetDirFunc(isProfile, extension.id);
      if (sourceDir.exists() && (aIsProfile == isProfile))
        validExtensions.push({ sourceDir: sourceDir, isProfile: isProfile });
    }
    
    var lines = ["[Extra Files]\r\n",
                 "Count=" + validExtensions.length + "\r\n"];
    for (i = 0; i < lines.length; ++i)
      fos.write(lines[i], lines[i].length);
      
    for (i = 0; i < validExtensions.length; ++i) {
      var e = validExtensions[i];
      var relativeDir = getDir(e.isProfile ? KEY_PROFILEDIR : KEY_APPDIR, []);
      var lf = e.sourceDir.QueryInterface(Components.interfaces.nsILocalFile);
      var relDesc = lf.getRelativeDescriptor(relativeDir);
      var line = "File" + i + "=" + relDesc + "\r\n";
      fos.write(line, line.length);
    }
    fos.close();
  },
  
  _getComponentsDir: function nsExtensionManager__getComponentsDir (aIsProfile, aExtensionID)
  {
    return getDirNoCreate(getDirKey(aIsProfile), 
                          [DIR_EXTENSIONS, aExtensionID, DIR_COMPONENTS]);
  },
 
  _getPreferencesDir: function nsExtensionManager__getPreferencesDir (aIsProfile, aExtensionID)
  {
    return getDirNoCreate(getDirKey(aIsProfile), 
                          [DIR_EXTENSIONS, aExtensionID, 
                           DIR_DEFAULTS, DIR_DEFAULTS_PREFS]);
  },

  _writeComponentManifest: function nsExtensionManager__writeComponentManifest (aIsProfile)
  {
    var manifest = aIsProfile ? getFile(KEY_PROFILEDIR, [FILE_COMPONENT_MANIFEST]) : 
                                getFile(KEY_APPDIR, [FILE_COMPONENT_MANIFEST]);
    this._writeProfileFile(manifest, this._getComponentsDir, aIsProfile);

    // Now refresh the compatibility manifest.
    this._writeCompatibilityManifest(true);
  },
  
  _writeCompatibilityManifest: function nsExtensionManager__writeCompatibilityManifest (aComponentListUpdated)
  {
    var fos = Components.classes["@mozilla.org/network/file-output-stream;1"]
                        .createInstance(Components.interfaces.nsIFileOutputStream);
    const MODE_WRONLY   = 0x02;
    const MODE_CREATE   = 0x08;
    const MODE_TRUNCATE = 0x20;

    // The compat file only lives in the Profile dir because we make the 
    // assumption that you can never have extensions prior to profile
    // startup.
    var compat = getFile(KEY_PROFILEDIR, [FILE_COMPAT_MANIFEST]);
    fos.init(compat, MODE_WRONLY | MODE_CREATE | MODE_TRUNCATE, 0644, 0);

    var currAppBuildID = gPref.getCharPref(PREF_EM_APP_BUILDID);

    var val = aComponentListUpdated ? 1 : 0;
    var lines = ["[Compatibility]\r\n",
                 "Build ID=" + currAppBuildID + "\r\n",
                 "Components List Changed=" + val + "\r\n"];
    for (var i = 0; i < lines.length; ++i)
      fos.write(lines[i], lines[i].length);

    fos.close();
  },
  
  _writeDefaults: function nsExtensionManager__writeDefaults (aIsProfile)
  {
    var manifest = aIsProfile ? getFile(KEY_PROFILEDIR, [FILE_DEFAULTS]) : 
                                getFile(KEY_APPDIR, [FILE_DEFAULTS]);
    this._writeProfileFile(manifest, this._getPreferencesDir, aIsProfile);
  },
  
  _cleanDirs: function nsExtensionManager__cleanDirs ()
  {
    var keys = [KEY_PROFILEDIR, KEY_APPDIR];
    for (var i = 0; i < keys.length; ++i) {
      var extensions = getDir(keys[i], [DIR_EXTENSIONS]);
      var entries = extensions.directoryEntries;
      while (entries.hasMoreElements()) {
        var entry = entries.getNext().QueryInterface(Components.interfaces.nsIFile);
        if (entry.isDirectory() && !entry.directoryEntries.hasMoreElements()) {
          try {
            entry.remove(false);
          }
          catch (e) { }
        }
      }
    }
  },
  
  /////////////////////////////////////////////////////////////////////////////  
  // nsIExtensionManager
  installExtension: function nsExtensionManager_installExtension (aXPIFile, aFlags)
  {
    // Since we're installing a "new type" extension, we assume a file layout
    // within the XPI like so:
    // foo.xpi/
    //         extension.rdf
    //         chrome/
    //         components/ 
    //         defaults/
    //                  prefs/
    var installProfile = aFlags & nsIExtensionManager.FLAG_INSTALL_PROFILE;

    var tempDir = getDir(getDirKey(installProfile), [DIR_EXTENSIONS, DIR_TEMP]);
    var fileName = getRandomFileName("temp", "xpi");
    aXPIFile.copyTo(tempDir, fileName);
    var xpiFile = tempDir.clone();
    xpiFile.append(fileName);

    // if the source file was read-only, fix permissions
    if (!xpiFile.isWritable()) {
      xpiFile.permissions = 0644;
    }

    var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"]
                              .createInstance(Components.interfaces.nsIZipReader);
    zipReader.init(xpiFile);
    zipReader.open();
    
    var tempManifest = getFile(getDirKey(installProfile),
                               [DIR_EXTENSIONS, DIR_TEMP, getRandomFileName("install", "rdf")]);
    if (!tempManifest.exists())
      tempManifest.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0644);
    zipReader.extract(FILE_INSTALL_MANIFEST, tempManifest);
    
    var extensionID = this.installExtensionInternal(xpiFile, tempManifest, installProfile);
    switch (extensionID) {
    case ERROR_EXTENSION_IS_THEME:
      this.installTheme(aXPIFile, aFlags);
      break;
    case ERROR_INVALID_VERSION:
    case ERROR_PHONED_HOME:
      break;
    default:
      // Then we stage the extension's XPI into a temporary directory so we 
      // can extract them after the next restart. 
      this._stageExtensionXPI(zipReader, extensionID, installProfile);

      this._writeComponentManifest(installProfile);
    }
    
    zipReader.close();
    tempManifest.remove(false);
    
    if (extensionID != ERROR_PHONED_HOME)
      xpiFile.remove(false);
  },
  
  installExtensionInternal: function nsExtensionManager_installExtensionInternal (aXPIFile, aManifest, aIsProfile)
  {
    var ds = getInstallManifest(aManifest);
    if (!ds) return;
    
    // XXXben - this is a hack until we properly fix xpinstall to be able to install
    //          different chrome types from trusted script. At the moment, when we
    //          call initManagerFromChrome, we can only install extensions, since
    //          the code path that installs themes is not utilized. To minimize the
    //          level of changes happening at the lower level in xpinstall at this
    //          point I am inserting this hack which checks for a theme-only property
    //          in the install manifest.
    var manifestRoot = gRDF.GetResource("urn:mozilla:install-manifest");
    var internalName = gRDF.GetResource(EM_NS("internalName"));
    if (stringData(ds.GetTarget(manifestRoot, internalName, true)) != "--")
      return ERROR_EXTENSION_IS_THEME;
    
    // We do a basic version check first just to make sure we somehow weren't 
    // tricked into installing an incompatible extension...
    this._ensureDS();
    var extensionID = this.canInstallItem(ds);
    // |extensionID| must be a GUID string, not a number - a number means failure.
    if (isNaN(parseInt(extensionID)))
      this._configureForthcomingItem(ds, extensionID, aIsProfile);
    else if (extensionID == 0) {
      var io = new this.IncompatibleObserver(this);
      var isChecking = io.checkForUpdates(ds, nsIUpdateItem.TYPE_EXTENSION,
                                          aXPIFile, aIsProfile);
      if (!isChecking)
        showIncompatibleError(ds);
      else {
        extensionID = ERROR_PHONED_HOME; // caller uses this to distinguish 
                                         // phone-home attempt.
      }
    }
    
    return extensionID;
  },
  
  IncompatibleObserver: function nsExtensionManager_IncompatibleObserver (aEM) 
  {
    this._item = null;
    this._em = aEM;
    this._ds = null;
    this._xpi = null;
    this._extensionID = 0;
    this._isProfile = true;
    
    this.checkForUpdates = function nsExtensionManager__iOcheckForUpdates (aDataSource, aType, 
                                                                           aXPIFile, aIsProfile)
    {
      // Construct a nsIUpdateItem for this extension...
      var item = this._em._getItemForIncompatibleID(aDataSource, aType);
      if (item) {
        this._item      = item;
        this._ds        = aDataSource;
        this._xpi       = aXPIFile;
        this._isProfile = true;
        
        gOS.addObserver(this, "Update:Extension:Started", false);
        gOS.addObserver(this, "Update:Extension:Item-Ended", false);
        gOS.addObserver(this, "Update:Extension:Item-Error", false);
        gOS.addObserver(this, "Update:Extension:Ended", false);

        this._em.update([item], 1, true);
        
        return true;
      }
      return false;
    }
    
    this.observe = function nsExtensionManager__iOobserve (aSubject, aTopic, aData)
    {
      switch (aTopic) {
      case "Update:Extension:Started":
        break;
      case "Update:Extension:Item-Ended":
        if (aSubject) {
          var item = aSubject.QueryInterface(Components.interfaces.nsIUpdateItem);
          this._em._ds.setTargetApplicationInfo(item.id, 
                                                item.minAppVersion,
                                                item.maxAppVersion, 
                                                this._ds, 
                                                this._item.type);
          this._extensionID = this._em.canInstallItem(this._ds);
        }
        break;
      case "Update:Extension:Item-Error":
        break;
      case "Update:Extension:Ended":
        gOS.removeObserver(this, "Update:Extension:Started");
        gOS.removeObserver(this, "Update:Extension:Item-Ended");
        gOS.removeObserver(this, "Update:Extension:Item-Error");
        gOS.removeObserver(this, "Update:Extension:Ended");
        
        if (isNaN(this._extensionID)) {
          var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"]
                                    .createInstance(Components.interfaces.nsIZipReader);
          zipReader.init(this._xpi);
          zipReader.open();

          // Add the item after all
          this._em._configureForthcomingItem(this._ds, this._extensionID, 
                                             this._isProfile);
          this._em._stageExtensionXPI(zipReader, this._extensionID, this._isProfile);
          this._em._writeComponentManifest(this._isProfile);
          
          zipReader.close();
        }
        else 
          showIncompatibleError(this._ds);
        
        // Now really delete the temporary XPI file
        this._xpi.remove(false);
        break;
      }
    }
  },
  
  _configureForthcomingItem: function nsExtensionManager__configureForthcomingItem (aDataSource, 
                                                                                    aExtensionID, 
                                                                                    aIsProfile)
  {
    // Clear any "disabled" flags that may have been set by the mismatch 
    // checking code at startup.
    var props = { toBeDisabled  : null,
                  disabled      : null,
                  toBeInstalled : this._ds._emL("true"),
                  name          : this.getManifestProperty(aDataSource, "name"),
                  version       : this.getManifestProperty(aDataSource, "version") };
    for (var p in props) {
      this._ds.setItemProperty(aExtensionID, this._ds._emR(p),
                               props[p], aIsProfile,
                               nsIUpdateItem.TYPE_EXTENSION);
    }

    // Insert it into the child list NOW rather than later because:
    // - extensions installed using the command line need to be a member
    //   of a container during the install phase for the code to be able
    //   to identify profile vs. global
    // - extensions installed through the UI should show some kind of
    //   feedback to indicate their presence is forthcoming (i.e. they
    //   will be available after a restart).
    this._ds.insertForthcomingItem(aExtensionID, nsIUpdateItem.TYPE_EXTENSION, 
                                   aIsProfile);
  },
  
  _getItemForIncompatibleID: function nsExtensionManager__getItemForID (aDataSource, aType)
  {
    var newItem = null;
    var id, version, targetAppInfo, name, updateURL;
    var manifestRoot = gRDF.GetResource("urn:mozilla:install-manifest");
    try {
      function getProperty (aDataSource, aSourceResource, aProperty)
      {
        var rv;
        try {
          var property = gRDF.GetResource(EM_NS(aProperty));
          rv = stringData(aDataSource.GetTarget(aSourceResource, property, true));
          if (rv == "--")
            throw Components.results.NS_ERROR_FAILURE;
        }
        catch (e) { }
        return rv;
      }
      
      var root = gRDF.GetResource("urn:mozilla:install-manifest");
      id            = getProperty(aDataSource, root, "id");
      version       = getProperty(aDataSource, root, "version");
      targetAppInfo = this._ds.getTargetApplicationInfo(id, aDataSource, aType);
      name          = getProperty(aDataSource, root, "name");
      updateURL     = getProperty(aDataSource, root, "updateURL");
      if (updateURL == "--")
        updateURL = "";
      
      newItem = Components.classes["@mozilla.org/updates/item;1"]
                          .createInstance(Components.interfaces.nsIUpdateItem);
      newItem.init(id, version, targetAppInfo.minVersion, 
                   targetAppInfo.maxVersion,
                   name, -1, "", "", updateURL, aType);
    }
    catch (e) {
      return null;
    }
    return newItem;
  },
  
  canInstallItem: function nsExtensionManager_canInstallItem (aDataSource)
  {
    var manifestRoot = gRDF.GetResource("urn:mozilla:install-manifest");
    // First make sure the item has a valid "version" property. 
    var version = gRDF.GetResource(EM_NS("version"));
    var versionLiteral = stringData(aDataSource.GetTarget(manifestRoot, version, true));
    if (!getVersionChecker().isValidVersion(versionLiteral)) {
      var name = gRDF.GetResource(EM_NS("name"));
      var nameLiteral = stringData(aDataSource.GetTarget(manifestRoot, name, true));
      showInvalidVersionError(nameLiteral, versionLiteral);
      return ERROR_INVALID_VERSION;
    }
        
    // Check the target application range specified by the extension metadata.
    if (this._ds.isCompatible(aDataSource, manifestRoot)) {
      var id = gRDF.GetResource(EM_NS("id"));
      var idLiteral = aDataSource.GetTarget(manifestRoot, id, true);
      return idLiteral.QueryInterface(Components.interfaces.nsIRDFLiteral).Value;
    }
    return 0;
  },
  
  getManifestProperty: function nsExtensionManager_getManifestProperty (aDataSource, aProperty)
  {
    var manifestRoot = gRDF.GetResource("urn:mozilla:install-manifest");
    var arc = gRDF.GetResource(EM_NS(aProperty));
    return aDataSource.GetTarget(manifestRoot, arc, true);
  },
  
  _stageExtensionXPI: function nsExtensionManager__stageExtensionXPI (aZipReader, aExtensionID, aInstallProfile)
  {
    // Get the staging dir
    var dir = getDir(getDirKey(aInstallProfile),
                     [DIR_EXTENSIONS, DIR_TEMP, aExtensionID]);
    var extensionFileName = aExtensionID + ".xpi";
    var extensionFile = dir.clone();
    extensionFile.append(extensionFileName);
    if (extensionFile.exists())
      extensionFile.remove(false);
    aZipReader.file.copyTo(dir, extensionFileName);

    // if the source file was readonly, fix the permissions
    if (!extensionFile.isWritable()) {
      extensionFile.permissions = 0644;
    }
  },
  
  // This function is called on the next startup 
  _finalizeInstall: function nsExtensionManager__finalizeInstall (aExtensionID)
  {
    var isProfile = this._ds.isProfileItem(aExtensionID);
    if (aExtensionID == 0 || aExtensionID == -1) {
      this._ds.removeCorruptItem(aExtensionID, 
                                 nsIUpdateItem.TYPE_EXTENSION, 
                                 isProfile);
      return;
    }
    
    if (!this._extInstaller)
      this._extInstaller = new nsExtensionInstaller(this._ds);
      
    this._extInstaller.install(aExtensionID, isProfile);
    
    // Update the Components Manifest
    this._writeComponentManifest(isProfile);
    
    // Update the Defaults Manifest
    this._writeDefaults(isProfile);
  },
  
  _finalizeEnableDisable: function nsExtensionManager__finalizeEnableDisable (aExtensionID, aDisable)
  {
    if (!this._extEnabler)
      this._extEnabler = new nsExtensionEnabler(this._ds);
      
    var isProfile = this._ds.isProfileItem(aExtensionID);
    this._extEnabler.enable(aExtensionID, isProfile, aDisable);

    // clear temporary flags
    this._ds.setItemProperty(aExtensionID, 
                             this._ds._emR("toBeEnabled"),
                             null, isProfile,
                             nsIUpdateItem.TYPE_EXTENSION);
    this._ds.setItemProperty(aExtensionID, 
                             this._ds._emR("toBeDisabled"),
                             null, isProfile,
                             nsIUpdateItem.TYPE_EXTENSION);
  },
  
  _finalizeUninstall: function nsExtensionManager__finalizeUninstall (aExtensionID)
  {
    if (!this._extUninstaller)
      this._extUninstaller = new nsExtensionUninstaller(this._ds);
    var isProfile = this._ds.isProfileItem(aExtensionID);
    this._extUninstaller.uninstall(aExtensionID, isProfile);

    // Clean the extension resource
    this._ds.removeItemMetadata(aExtensionID, nsIUpdateItem.TYPE_EXTENSION);
    
    // Do this LAST since inferences are made about an item based on
    // what container it's in.
    this._ds.removeItemFromContainer(aExtensionID, 
                                     nsIUpdateItem.TYPE_EXTENSION,
                                     isProfile);
  },
      
  uninstallExtension: function nsExtensionManager_uninstallExtension (aExtensionID)
  {
    if (!this._ds.isDownloadItem(aExtensionID)) {
      this._ds.uninstallExtension(aExtensionID);

      var isProfile = this._ds.isProfileItem(aExtensionID);

      // Update the Components Manifest
      this._writeComponentManifest(isProfile);

      // Update the Defaults Manifest
      this._writeDefaults(isProfile);
    }
    else {
      // Bad download entry - uri is url, e.g. "http://www.foo.com/test.xpi"
      // ... just remove it from the list. 
      this._ds.removeCorruptDLItem(aExtensionID, nsIUpdateItem.TYPE_EXTENSION);
    }
  },
  
  enableExtension: function nsExtensionManager_enableExtension (aExtensionID)
  {
    this._ds.enableExtension(aExtensionID);

    var isProfile = this._ds.isProfileItem(aExtensionID);

    // Update the Components Manifest
    this._writeComponentManifest(isProfile);

    // Update the Defaults Manifest
    this._writeDefaults(isProfile);
  },
  
  disableExtension: function nsExtensionManager_disableExtension (aExtensionID)
  {
    this._ds.disableExtension(aExtensionID);

    var isProfile = this._ds.isProfileItem(aExtensionID);

    // Update the Components Manifest
    this._writeComponentManifest(isProfile);

    // Update the Defaults Manifest
    this._writeDefaults(isProfile);
  },
  
  enableTheme: function nsExtensionsDataSource_enableTheme (aThemeID)
  {
    this._ds.enableTheme(aThemeID);
  },
    
  disableTheme: function nsExtensionsDataSource_disableTheme (aThemeID)
  {
    this._ds.disableTheme(aThemeID);
  },
  
  update: function nsExtensionManager_update (aItems, aItemCount, aVersionUpdateOnly)
  {
    var appID = gPref.getCharPref(PREF_EM_APP_ID);
    var appVersion = gPref.getCharPref(PREF_EM_APP_EXTENSIONS_VERSION);

    if (aItems.length == 0) {
      var addonType = nsIUpdateItem.TYPE_ADDON;
      aItems = this.getItemList(null, addonType, { });
    }
    var updater = new nsExtensionItemUpdater(appID, appVersion, this);
    updater.checkForUpdates(aItems, aItems.length, aVersionUpdateOnly);
  },
  
  getItemList: function nsExtensionManager_getItemList (aItemID, aType, aCountRef)
  {
    this._ensureDS();
    return this._ds.getItemList(aItemID, aType, aCountRef);
  },    

  /////////////////////////////////////////////////////////////////////////////  
  // Themes
  installTheme: function nsExtensionManager_installTheme (aJARFile, aFlags)
  {
    this._ensureDS();
    
    var isProfile = aFlags & nsIExtensionManager.FLAG_INSTALL_PROFILE;
    var installer = new nsThemeInstaller(this._ds, this);
    installer.install(aJARFile, isProfile);
    // XPInstall selects the theme, if necessary.
  },
  
  uninstallTheme: function nsExtensionManager_uninstallTheme (aThemeID)
  {
    if (!this._ds.isDownloadItem(aThemeID)) {
      this._ensureDS();
      this._ds.uninstallTheme(aThemeID);
    }
    else {
      // Bad download entry - uri is url, e.g. "http://www.foo.com/test.jar"
      // ... just remove it from the list. 
      this._ds.removeCorruptDLItem(aThemeID, nsIUpdateItem.TYPE_THEME);
    }
  },
  
  moveTop: function nsExtensionManager_moveTop (aItemID)
  {
    this._ds.moveTop(aItemID);
  },
  
  moveUp: function nsExtensionManager_moveUp (aItemID)
  {
    this._ds.moveUp(aItemID);
  },
  
  moveDown: function nsExtensionManager_moveDown (aItemID)
  {
    this._ds.moveDown(aItemID);
  },

  get datasource()
  {
    this._ensureDS();
    return this._ds;
  },
  
  /////////////////////////////////////////////////////////////////////////////    
  // Downloads
  _transactions: [],
  _downloadCount: 0,
  addDownloads: function nsExtensionManager_addDownloads (aItems, aItemCount)
  {
    this._downloadCount += aItemCount;
    
    var txn = new nsItemDownloadTransaction(this);
    for (var i = 0; i < aItemCount; ++i) {
      var currItem = aItems[i];
      var txnID = Math.round(Math.random() * 100);
      txn.addDownload(currItem.name, currItem.xpiURL, currItem.iconURL, 
                      currItem.type, txnID);
      this._transactions.push(txn);
    }

    // Kick off the download process for this transaction
    gOS.addObserver(this, "offline-requested", false);
    gOS.addObserver(this, "quit-application-requested", false);
    gOS.notifyObservers(txn, "xpinstall-progress", "open");  
  },
  
  removeDownload: function nsExtensionManager_removeDownload (aURL, aType)
  {
    for (var i = 0; i < this._transactions.length; ++i) {
      if (this._transactions[i].containsURL(aURL)) {
        this._transactions[i].removeDownload(aURL, aType);
        return;
      }
    } 
  },
  
  _removeAllDownloads: function nsExtensionManager__removeAllDownloads ()
  {
    for (var i = 0; i < this._transactions.length; ++i)
      this._transactions[i].removeAllDownloads();
  },
  
  // The nsIXPIProgressDialog implementation in the download transaction object
  // forwards notifications through these methods which we then pass on to any
  // front end objects implementing nsIExtensionDownloadProgressListener that 
  // are listening. We maintain the master state of download operations HERE, 
  // not in the front end, because if the user closes the extension or theme 
  // managers during the downloads we need to maintain state and not terminate
  // the download/install process. 
  onStateChange: function nsExtensionManager_onStateChange (aTransaction, aURL, aState, aValue)
  {
    if (!(aURL in this._progressData)) 
      this._progressData[aURL] = { };
    this._progressData[aURL].state = aState;
    
    for (var i = 0; i < this._downloadObservers.length; ++i)
      this._downloadObservers[i].onStateChange(aURL, aState, aValue);

    const nsIXPIProgressDialog = Components.interfaces.nsIXPIProgressDialog;
    switch (aState) {
    case nsIXPIProgressDialog.INSTALL_DONE:
      --this._downloadCount;
      break;
    case nsIXPIProgressDialog.DIALOG_CLOSE:
      for (var i = 0; i < this._transactions.length; ++i) {
        if (this._transactions[i].id == aTransaction.id) {
          this._transactions.splice(i, 1);
          delete aTransaction;
          break;
        }
      }
      break;
    }
  },
  
  _progressData: { },
  onProgress: function nsExtensionManager_onProgress (aURL, aValue, aMaxValue)
  {
    for (var i = 0; i < this._downloadObservers.length; ++i)
      this._downloadObservers[i].onProgress(aURL, aValue, aMaxValue);
    
    if (!(aURL in this._progressData)) 
      this._progressData[aURL] = { };
    this._progressData[aURL].progress = Math.round((aValue / aMaxValue) * 100);
  },

  _downloadObservers: [],
  addDownloadObserver: function nsExtensionManager_addDownloadObserver (aXPIProgressDialog)
  {
    for (var i = 0; i < this._downloadObservers.length; ++i) {
      if (this._downloadObservers[i] == aXPIProgressDialog)
        return i;
    }
    this._downloadObservers.push(aXPIProgressDialog);
    return this._downloadObservers.length - 1;
  },
  
  removeDownloadObserverAt: function nsExtensionManager_removeDownloadObserverAt (aIndex)
  {
    this._downloadObservers.splice(aIndex, 1);
    if (this._downloadCount != 0)
      this._ds.flushProgressInfo(this._progressData);
  },

  //
  _ds: null,

  /////////////////////////////////////////////////////////////////////////////    
  // Other
  
  // This should NOT be called until after the window is shown! 
  _ensureDS: function nsExtensionManager__ensureDS ()
  {
    if (!this._ds) {
      // dump("*** loading the extensions datasource\n");
      this._ds = new nsExtensionsDataSource();
      if (this._ds) {
        this._ds.loadExtensions(false);
        this._ds.loadExtensions(true);
      }
      
      // Ensure any pre-configured items are initialized.
      (new nsInstalledExtensionReader(this)).read();
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // nsIClassInfo
  getInterfaces: function nsExtensionManager_getInterfaces (aCount)
  {
    var interfaces = [Components.interfaces.nsIExtensionManager,
                      Components.interfaces.nsIXPIProgressDialog,
                      Components.interfaces.nsIObserver];
    aCount.value = interfaces.length;
    return interfaces;
  },
  
  getHelperForLanguage: function nsExtensionManager_getHelperForLanguage (aLanguage)
  {
    return null;
  },
  
  get contractID() 
  {
    return "@mozilla.org/extensions/manager;1";
  },
  
  get classDescription()
  {
    return "Extension Manager";
  },
  
  get classID() 
  {
    return Components.ID("{8A115FAA-7DCB-4e8f-979B-5F53472F51CF}");
  },
  
  get implementationLanguage()
  {
    return Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT;
  },
  
  get flags()
  {
    return Components.interfaces.nsIClassInfo.SINGLETON;
  },

  /////////////////////////////////////////////////////////////////////////////
  // nsISupports
  QueryInterface: function nsExtensionManager_QueryInterface (aIID) 
  {
    if (!aIID.equals(Components.interfaces.nsIExtensionManager) &&
        !aIID.equals(Components.interfaces.nsIObserver) &&
        !aIID.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

///////////////////////////////////////////////////////////////////////////////
//
// nsItemDownloadTransaction
//
//   This object implements nsIXPIProgressDialog and represents a collection of
//   XPI/JAR download and install operations. There is one 
//   nsItemDownloadTransaction per back-end XPInstallManager object. We maintain
//   a collection of separate transaction objects because it's possible to have
//   multiple separate XPInstall download/install operations going on 
//   simultaneously, each with its own XPInstallManager instance. For instance
//   you could start downloading two extensions and then download a theme. Each
//   of these operations would open the appropriate FE and have to be able to
//   track each operation independently.
//
function nsItemDownloadTransaction(aManager)
{
  this._manager = aManager;
  this._downloads = [];
}

nsItemDownloadTransaction.prototype = {
  _manager    : null,
  _downloads  : [],
  id          : -1,
  
  addDownload: function nsItemDownloadTransaction_addDownload (aName, aURL, aIconURL, aItemType, aID)
  {
    this._downloads.push({ url: aURL, type: aItemType, waiting: true });
    this._manager._ds.addDownload(aName, aURL, aIconURL, aItemType);
    this.id = aID;
  },
  
  removeDownload: function nsItemDownloadTransaction_removeDownload (aURL, aItemType)
  {
    this._manager._ds.removeDownload(aURL, aItemType);
  },
  
  removeAllDownloads: function nsItemDownloadTransaction_removeAllDownloads ()
  {
    for (var i = 0; i < this._downloads.length; ++i)
      this.removeDownload(this._downloads[i].url, this._downloads[i].type);
  },
  
  containsURL: function nsItemDownloadTransaction_containsURL (aURL)
  {
    for (var i = 0; i < this._downloads.length; ++i) {
      if (this._downloads[i].url == aURL)
        return true;
    }
    return false;
  },

  /////////////////////////////////////////////////////////////////////////////  
  // nsIXPIProgressDialog
  onStateChange: function nsItemDownloadTransaction_onStateChange (aIndex, aState, aValue)
  {
    this._manager.onStateChange(this, this._downloads[aIndex].url, aState, aValue);
  },
  
  onProgress: function nsItemDownloadTransaction_onProgress (aIndex, aValue, aMaxValue)
  {
    this._manager.onProgress(this._downloads[aIndex].url, aValue, aMaxValue);
  },
  
  /////////////////////////////////////////////////////////////////////////////
  // nsISupports
  QueryInterface: function nsItemDownloadTransaction_QueryInterface (aIID) 
  {
    if (!aIID.equals(Components.interfaces.nsIXPIProgressDialog) &&
        !aIID.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

///////////////////////////////////////////////////////////////////////////////
//
// nsExtensionItemUpdater
//
function nsExtensionItemUpdater(aTargetAppID, aTargetAppVersion, aEM) 
{
  this._appID = aTargetAppID;
  this._appVersion = aTargetAppVersion;
  this._emDS = aEM._ds;
  this._em = aEM;

  getVersionChecker();
}

nsExtensionItemUpdater.prototype = {
  _appID              : "",
  _appVersion         : "",
  _emDS               : null,
  _em                 : null,
  _versionUpdateOnly  : 0,
  _items              : [],
  
  /////////////////////////////////////////////////////////////////////////////
  // nsIExtensionItemUpdater
  //
  // When we check for updates to an item, there are two pieces of information
  // that are returned - 1) info about the newest available version, if any,
  // and 2) info about the currently installed version. The latter is provided
  // primarily to inform the client of changes to the application compatibility 
  // metadata for the current item. Depending on the situation, either 2 or 
  // 1&2 may be what is required.
  //
  // Callers:
  //  1 - nsUpdateService.js, user event
  //      User clicked on the update icon to invoke an update check, 
  //      user clicked on an Extension/Theme and clicked "Update". In this
  //      case we want to update compatibility metadata about the installed
  //      version, and look for newer versions to offer. 
  //  2 - nsUpdateService.js, background event
  //      Timer fired, background update is being performed. In this case
  //      we also want to update compatibility metadata and look for newer
  //      versions.
  //  3 - Mismatch
  //      User upgraded to a newer version of the app, update compatibility
  //      metadata and look for newer versions.
  //  4 - Install Phone Home
  //      User installed an item that was deemed incompatible based only
  //      on the information provided in the item's install.rdf manifest, 
  //      we look ONLY for compatibility updates in this case to determine
  //      whether or not the item can be installed.
  //  
  checkForUpdates: function nsExtensionItemUpdater_checkForUpdates (aItems, aItemCount, 
                                                                    aVersionUpdateOnly) 
  {
    gOS.notifyObservers(null, "Update:Extension:Started", "");
    this._versionUpdateOnly = aVersionUpdateOnly;
    this._items = aItems;
    this._responseCount = aItemCount;
    
    // This is the number of extensions/themes/etc that we found updates for.
    this._updateCount = 0;

    for (var i = 0; i < aItemCount; ++i) {
      var e = this._items[i];
      gOS.notifyObservers(e, "Update:Extension:Item-Started", "");
      (new nsRDFItemUpdater(this)).checkForUpdates(e, aVersionUpdateOnly);
    }
  },
  
  /////////////////////////////////////////////////////////////////////////////
  // nsExtensionItemUpdater
  _applyVersionUpdates: function nsExtensionItemUpdater__applyVersionUpdates (aLocalItem, aRemoteItem)
  {
    var r = this._emDS._getResourceForItem(aLocalItem.id);
    if (!r) return;
    var targetAppInfo = this._emDS.getTargetApplicationInfo(aLocalItem.id, this._emDS, 
                                                            getItemType(r.Value));
    if (gVersionChecker.compare(targetAppInfo.maxVersion, aRemoteItem.maxAppVersion) < 0) {
      // Remotely specified maxVersion is newer than the maxVersion 
      // for the installed Extension. Apply that change to the datasource.
      this._emDS.setTargetApplicationInfo(aLocalItem.id, 
                                          aRemoteItem.minAppVersion, 
                                          aRemoteItem.maxAppVersion,
                                          null, aLocalItem.type);
      
      // If we got here through |checkForMismatches|, this extension has
      // already been disabled, re-enable it.
      if (this._emDS.getItemProperty(aLocalItem.id, "disabled") == "true") 
        this._em.enableExtension(aLocalItem.id);
    }
  },
  
  _isValidUpdate: function nsExtensionItemUpdater__isValidUpdate (aLocalItem, aRemoteItem) 
  {
    var appExtensionsVersion = gPref.getCharPref(PREF_EM_APP_EXTENSIONS_VERSION);

    // Check if the update will only run on a newer version of Firefox. 
    if (aRemoteItem.minAppVersion && 
        gVersionChecker.compare(appExtensionsVersion, aRemoteItem.minAppVersion) < 0) 
      return false;

    // Check if the update will only run on an older version of Firefox. 
    if (aRemoteItem.maxAppVersion && 
        gVersionChecker.compare(appExtensionsVersion, aRemoteItem.maxAppVersion) > 0) 
      return false;
    
    return true;
  },
  
  _checkForDone: function nsExtensionItemUpdater__checkForDone ()
  {
    if (--this._responseCount == 0) {
      if (!this._versionUpdateOnly)
        gPref.setIntPref(PREF_UPDATE_COUNT, this._updateCount); 
          
      gOS.notifyObservers(null, "Update:Extension:Ended", "");
    }
  },
  
  /////////////////////////////////////////////////////////////////////////////
  // nsISupports
  QueryInterface: function nsExtensionItemUpdater_QueryInterface (aIID) 
  {
    if (!aIID.equals(Components.interfaces.nsIExtensionItemUpdater) &&
        !aIID.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }  
};

function nsRDFItemUpdater(aUpdater)
{
  this._updater = aUpdater;
}

nsRDFItemUpdater.prototype = {
  _updater            : null,
  _versionUpdateOnly  : 0,
  _item               : null,
  
  checkForUpdates: function (aItem, aVersionUpdateOnly)
  {
    // A preference setting can disable updating for this item
    try {
      if (!gPref.getBoolPref(PREF_EM_ITEM_UPDATE_ENABLED.replace(/%UUID%/, aItem.id))) {
        gOS.notifyObservers(null, "Update:Extension:Item-Ended", "");
        this._updater._checkForDone();
        return;
      }
    }
    catch (e) { }

    this._versionUpdateOnly = aVersionUpdateOnly;
    this._item = aItem;
  
    // Look for a custom update URI: 1) supplied by a pref, 2) supplied by the
    // install manifest, 3) the default configuration
    try {
      var dsURI = gPref.getComplexValue(PREF_EM_ITEM_UPDATE_URL.replace(/%UUID%/, aItem.id),
                                        Components.interfaces.nsIPrefLocalizedString).data;
    }
    catch (e) { }
    if (!dsURI)
      dsURI = aItem.updateRDF;
    if (!dsURI) {
      dsURI = gPref.getComplexValue(PREF_UPDATE_DEFAULT_URL,
                                    Components.interfaces.nsIPrefLocalizedString).data;
    }
    dsURI = dsURI.replace(/%ITEM_ID%/g, aItem.id);
    dsURI = dsURI.replace(/%ITEM_VERSION%/g, aItem.version);
    dsURI = dsURI.replace(/%ITEM_MAXAPPVERSION%/g, aItem.maxAppVersion);
    dsURI = dsURI.replace(/%APP_ID%/g, this._updater._appID);
    dsURI = dsURI.replace(/%APP_VERSION%/g, this._updater._appVersion);
    dsURI = dsURI.replace(/%REQ_VERSION%/g, 1);
    
    // escape() does not properly encode + symbols in any embedded FVF strings.
    dsURI = dsURI.replace(/\+/g, "%2B");

    var ds = gRDF.GetDataSource(dsURI);
    var rds = ds.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource)
    if (rds.loaded)
      this.onDatasourceLoaded(ds, aItem);
    else {
      var sink = ds.QueryInterface(Components.interfaces.nsIRDFXMLSink);
      sink.addXMLSinkObserver(this);
    }
  },

  onDatasourceLoaded: function nsExtensionItemUpdater_onDatasourceLoaded (aDatasource, aLocalItem)
  {
    ///////////////////////////////////////////////////////////////////////////    
    // The extension update RDF file looks something like this:
    //
    //  <RDF:Description about="urn:mozilla:extension:{GUID}">
    //    <em:updates>
    //      <RDF:Seq>
    //        <RDF:li resource="urn:mozilla:extension:{GUID}:4.9"/>
    //        <RDF:li resource="urn:mozilla:extension:{GUID}:5.0"/>
    //      </RDF:Seq>
    //    </em:updates>
    //    <!-- the version of the extension being offered -->
    //    <em:version>5.0</em:version>
    //    <em:updateLink>http://www.mysite.com/myext-50.xpi</em:updateLink>
    //  </RDF:Description>
    //
    //  <RDF:Description about="urn:mozilla:extension:{GUID}:4.9">
    //    <em:version>4.9</em:version>
    //    <em:targetApplication>
    //      <RDF:Description>
    //        <em:id>{ec8030f7-c20a-464f-9b0e-13a3a9e97384}</em:id>
    //        <em:minVersion>0.9</em:minVersion>
    //        <em:maxVersion>1.0</em:maxVersion>
    //        <em:updateLink>http://www.mysite.com/myext-49.xpi</em:updateLink>
    //      </RDF:Description>
    //    </em:targetApplication>
    //  </RDF:Description>  
    //
    // If we get here because the following happened:
    // 1) User was using Firefox 0.9 with ExtensionX 0.5 (minVersion 0.8, 
    //    maxVersion 0.9 for Firefox)
    // 2) User upgraded Firefox to 1.0
    // 3) |checkForMismatches| deems ExtensionX 0.5 incompatible with this
    //    new version of Firefox on the basis of its maxVersion
    // 4) ** We reach this point **
    //
    // If the version of ExtensionX (0.5) matches that provided by the 
    // server, then this is a cue that the author updated the rdf file
    // or central repository to say "0.5 is ALSO compatible with Firefox 1.0,
    // no changes are necessary." In this event, the local metadata for
    // installed ExtensionX (0.5) is freshened with the new maxVersion, 
    // and we advance to the next item WITHOUT any download/install 
    // updates.
  
    // Parse the response RDF
    function UpdateData() {}; 
    UpdateData.prototype = { version: "0.0", updateLink: null, 
                             minVersion: "0.0", maxVersion: "0.0" };
    
    var versionUpdate = new UpdateData();
    var newestUpdate  = new UpdateData();

    var newerItem, sameItem;
    
    // Firefox 1.0PR+ update.rdf format
    if (!this._versionUpdateOnly) {
      // Look for newer versions of this item, we only do this in "normal" 
      // mode... see comment by nsExtensionItemUpdater_checkForUpdates 
      // about how we do this in all cases but Install Phone Home - which 
      // only needs to do a version check.
      this._parseV20UpdateInfo(aDatasource, aLocalItem, newestUpdate, false);
      if (!newestUpdate.updateLink) {
        // Firefox 0.9 update.rdf format - does not contain any metadata
        // that can be used for version updates, so performed in the "all updates"
        // mode only. 
        this._parseV10UpdateInfo(aDatasource, aLocalItem, newestUpdate);
      }

      newerItem = Components.classes["@mozilla.org/updates/item;1"]
                            .createInstance(Components.interfaces.nsIUpdateItem);
      newerItem.init(aLocalItem.id, 
                     newestUpdate.version, 
                     newestUpdate.minVersion, 
                     newestUpdate.maxVersion, 
                     aLocalItem.name, 
                     -1, newestUpdate.updateLink, "", "", 
                     aLocalItem.type);
      if (this._updater._isValidUpdate(aLocalItem, newerItem))
        ++this._updater._updateCount;
      else
        newerItem = null;
    }
    
    // Now look for updated version compatibility metadata for the currently
    // installed version...
    this._parseV20UpdateInfo(aDatasource, aLocalItem, versionUpdate, true);

    var result = gVersionChecker.compare(versionUpdate.version, 
                                          aLocalItem.version);
    if (result == 0) {
      // Local version exactly matches the "Version Update" remote version, 
      // Apply changes into local datasource.
      sameItem = Components.classes["@mozilla.org/updates/item;1"]
                           .createInstance(Components.interfaces.nsIUpdateItem);
      sameItem.init(aLocalItem.id, 
                    versionUpdate.version, 
                    versionUpdate.minVersion, 
                    versionUpdate.maxVersion, 
                    aLocalItem.name, 
                    -1, "", "", "", 
                    aLocalItem.type);
      if (!this._versionUpdateOnly) {
        if (this._updater._isValidUpdate(aLocalItem, sameItem)) {
          // Install-time updates are not written to the DS because there is no
          // entry yet, EM just uses the notifications to ascertain (by hand)
          // whether or not there is a remote maxVersion tweak that makes the 
          // item being installed compatible.
          this._updater._applyVersionUpdates(aLocalItem, sameItem);
        }
        else 
          sameItem = null;
      }
    }
    
    gOS.notifyObservers(!this._versionUpdateOnly ? newerItem : sameItem, 
                        "Update:Extension:Item-Ended", "");
    
    // Only one call of this._updater._checkForDone is needed for RDF 
    // responses, since there is only one response per item.
    this._updater._checkForDone();
  },

  // Parses Firefox 0.9 update.rdf format  
  _parseV10UpdateInfo: function nsExtensionItemUpdater__parseV10UpdateInfo (aDataSource, aLocalItem, aUpdateData)
  {
    var extensionRes  = gRDF.GetResource(getItemPrefix(aLocalItem.type) + aLocalItem.id);
    
    aUpdateData.version     = this._getPropertyFromResource(aDataSource, extensionRes, 
                                                            "version", aLocalItem);
    aUpdateData.updateLink  = this._getPropertyFromResource(aDataSource, extensionRes, 
                                                            "updateLink", aLocalItem);
  },
  
  // Get a compulsory property from a resource. Reports an error if the 
  // property was not present. 
  _getPropertyFromResource: function nsExtensionItemUpdater__getPropertyFromResource (aDataSource,
                                                                                      aSourceResource, 
                                                                                      aProperty, 
                                                                                      aLocalItem)
  {
    var rv;
    try {
      var property = gRDF.GetResource(EM_NS(aProperty));
      rv = stringData(aDataSource.GetTarget(aSourceResource, property, true));
      if (rv == "--")
        throw Components.results.NS_ERROR_FAILURE;
    }
    catch (e) { 
      // XXXben show console message "aProperty" not found on aSourceResource. 
      return null;
    }
    return rv;
  },
  
  // Parses Firefox 1.0RC1+ update.rdf format
  _parseV20UpdateInfo: function nsExtensionItemUpdater__parseV20UpdateInfo (aDataSource, 
                                                                            aLocalItem, 
                                                                            aUpdateData, 
                                                                            aVersionUpdatesOnly)
  {
    var extensionRes  = gRDF.GetResource(getItemPrefix(aLocalItem.type) + aLocalItem.id);

    var updatesArc = gRDF.GetResource(EM_NS("updates"));
    var updates = aDataSource.GetTarget(extensionRes, updatesArc, true);
    
    try {
      updates = updates.QueryInterface(Components.interfaces.nsIRDFResource);
    }
    catch (e) { return; }
    
    var cu = Components.classes["@mozilla.org/rdf/container-utils;1"]
                       .getService(Components.interfaces.nsIRDFContainerUtils);
    if (cu.IsContainer(aDataSource, updates)) {
      var c = Components.classes["@mozilla.org/rdf/container;1"]
                        .getService(Components.interfaces.nsIRDFContainer);
      c.Init(aDataSource, updates);

      // In "all update types" mode, we look for newer versions, starting with the 
      // current installed version.
      if (!aVersionUpdatesOnly) 
        aUpdateData.version = aLocalItem.version;

      var versions = c.GetElements();
      while (versions.hasMoreElements()) {
        // There are two different methodologies for collecting version 
        // information depending on whether or not we've bene invoked in 
        // "version updates only" mode or "version+newest" mode. 
        var version = versions.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        this._parseV20Update(aDataSource, version, aLocalItem, aUpdateData, aVersionUpdatesOnly);
        if (aVersionUpdatesOnly && aUpdateData.updateLink)
          break;
      }
    }
  },
  
  _parseV20Update: function nsExtensionItemUpdater__parseV20Update (aDataSource,
                                                                    aUpdateResource,
                                                                    aLocalItem,
                                                                    aUpdateData,
                                                                    aVersionUpdatesOnly)
  {
    var version = this._getPropertyFromResource(aDataSource, aUpdateResource, 
                                                "version", aLocalItem);
    var taArc = gRDF.GetResource(EM_NS("targetApplication"));
    var targetApps = aDataSource.GetTargets(aUpdateResource, taArc, true);
    while (targetApps.hasMoreElements()) {
      var targetApp = targetApps.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var id = this._getPropertyFromResource(aDataSource, targetApp, "id", aLocalItem);
      if (id != this._updater._appID)
        continue;
      
      var result = gVersionChecker.compare(version, aLocalItem.version);
      if (aVersionUpdatesOnly ? result == 0 : result > 0) {
        aUpdateData.version = version;
        aUpdateData.updateLink = this._getPropertyFromResource(aDataSource, targetApp, "updateLink", aLocalItem);
        aUpdateData.minVersion = this._getPropertyFromResource(aDataSource, targetApp, "minVersion", aLocalItem);
        aUpdateData.maxVersion = this._getPropertyFromResource(aDataSource, targetApp, "maxVersion", aLocalItem);
      }
    }
  },
  
  onDatasourceError: function nsExtensionItemUpdater_onDatasourceError (aItem, aError)
  {
    gOS.notifyObservers(aItem, "Update:Extension:Item-Error", aError);
    this._updater._checkForDone();
  },

  /////////////////////////////////////////////////////////////////////////////
  // nsIRDFXMLSinkObserver
  onBeginLoad: function(aSink)
  {
  },
  onInterrupt: function(aSink)
  {
  },
  onResume: function(aSink)
  {
  },
  
  onEndLoad: function(aSink)
  {
    try {
      aSink.removeXMLSinkObserver(this);
      
      var ds = aSink.QueryInterface(Components.interfaces.nsIRDFDataSource);
      this.onDatasourceLoaded(ds, this._item);
    }
    catch (e) { }
  },
  
  onError: function(aSink, aStatus, aErrorMsg)
  {
    try {
      aSink.removeXMLSinkObserver(this);
      
      this.onDatasourceError(this._item, aStatus.toString());
    }
    catch (e) { }
  }
};

///////////////////////////////////////////////////////////////////////////////
//
// nsExtensionsDataSource
//
function nsExtensionsDataSource()
{
}

nsExtensionsDataSource.prototype = {
  _appExtensions      : null,
  _profileExtensions  : null,  
  _composite          : null,
  safeMode            : false,
  
  _emR: function nsExtensionsDataSource__emR (aProperty) 
  {
    return gRDF.GetResource(EM_NS(aProperty));
  },
  
  _emL: function nsExtensionsDataSource__emL (aLiteral)
  {
    return gRDF.GetLiteral(aLiteral);
  },
  
  isCompatible: function nsExtensionsDataSource__isCompatible (aDS, aSource)
  {
    // XXXben - cheap hack. Our bundled items are always compatible. 
    if (aSource.EqualsNode(gRDF.GetResource(getItemPrefix(nsIUpdateItem.TYPE_THEME) + "{972ce4c6-7e08-4474-a285-3208198ce6fd}")) || 
        aSource.EqualsNode(gRDF.GetResource(getItemPrefix(nsIUpdateItem.TYPE_EXTENSION) + "{641d8d09-7dda-4850-8228-ac0ab65e2ac9}")))
      return true;
      
    var appVersion = gPref.getCharPref(PREF_EM_APP_EXTENSIONS_VERSION);
    var appID = gPref.getCharPref(PREF_EM_APP_ID);
    
    var targets = aDS.GetTargets(aSource, this._emR("targetApplication"), true);
    var idRes = this._emR("id");
    var minVersionRes = this._emR("minVersion");
    var maxVersionRes = this._emR("maxVersion");
    while (targets.hasMoreElements()) {
      var targetApp = targets.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var id          = stringData(aDS.GetTarget(targetApp, idRes, true));
      var minVersion  = stringData(aDS.GetTarget(targetApp, minVersionRes, true));
      var maxVersion  = stringData(aDS.GetTarget(targetApp, maxVersionRes, true));

      if (id == appID) {
        var versionChecker = getVersionChecker();
        return ((versionChecker.compare(appVersion, minVersion) >= 0) &&
                (versionChecker.compare(appVersion, maxVersion) <= 0));
      }
    }
    return false;
  },
  
  getIncompatibleItemList: function nsExtensionsDataSource_getIncompatibleItemList (aAppID, aAppVersion, aItemType)
  {
    var items = [];
    var roots = getItemRoots(aItemType);
    for (var i = 0; i < roots.length; ++i) {    
      var ctr = Components.classes["@mozilla.org/rdf/container;1"]
                          .createInstance(Components.interfaces.nsIRDFContainer);
      ctr.Init(this._composite, gRDF.GetResource(roots[i]));
      
      var elements = ctr.GetElements();
      while (elements.hasMoreElements()) {
        var e = elements.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        var itemType = getItemType(e.Value);
        if (itemType != -1 && !this.isCompatible(this, e))
          items.push(this.getItemForID(stripPrefix(e.Value, itemType)));
      }
    }
    return items;
  },
  
  getItemList: function nsExtensionsDataSource_getItemList(aItemID, aType, aCountRef)
  {
    var items = [];
    if (aItemID)
      items.push(this.getItemForID(aItemID));
    else {
      var roots = getItemRoots(aType);
      for (var i = 0; i < roots.length; ++i) {
        var ctr = Components.classes["@mozilla.org/rdf/container;1"]
                            .createInstance(Components.interfaces.nsIRDFContainer);
        ctr.Init(this, gRDF.GetResource(roots[i]));
        
        var elements = ctr.GetElements();
        while (elements.hasMoreElements()) {
          var e = elements.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
          var itemType = getItemType(e.Value);
          if (itemType != -1)
            items.push(this.getItemForID(stripPrefix(e.Value, itemType)));
        }
      }
    }
    aCountRef.value = items.length;
    return items;
  },

  // XXXben this function is a little weird since it returns an array of strings, not
  // an array of nsIUpdateItems...  
  getItemsWithFlagSet: function nsExtensionsDataSource_getItemsWithFlagSet (aFlag)
  {
    var items = [];
    var sources = this.GetSources(this._emR(aFlag), this._emL("true"), true);
    while (sources.hasMoreElements()) {
      var e = sources.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      
      items.push(stripPrefix(e.Value, getItemType(e.Value)));
    }
    return items;
  },
  
  getItemsWithFlagUnset: function nsExtensionsDataSource_getItemsWithFlagUnset (aFlag, aItemType)
  {
    var items = [];
    
    var roots = getItemRoots(aItemType);
    for (var i = 0; i < roots.length; ++i) {
      var ctr = Components.classes["@mozilla.org/rdf/container;1"]
                          .createInstance(Components.interfaces.nsIRDFContainer);
      ctr.Init(this, gRDF.GetResource(roots[i]));
      
      var elements = ctr.GetElements();
      while (elements.hasMoreElements()) {
        var e = elements.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        if (getItemType(e.Value) != -1) {
          var value = this.GetTarget(e, this._emR(aFlag), true);
          if (!value)
            items.push(stripPrefix(e.Value, getItemType(e.Value)));
        }
      }
    }
    return items;
  },
  
  getItemForID: function nsExtensionsDataSource_getItemForID (aItemID)
  {
    var item = Components.classes["@mozilla.org/updates/item;1"]
                         .createInstance(Components.interfaces.nsIUpdateItem);
                         
    var r = this._getResourceForItem(aItemID);
    if (!r)
      return null;
    
    var targetAppInfo = this.getTargetApplicationInfo(aItemID, this, getItemType(r.Value));
    item.init(aItemID, 
              this.getItemProperty(aItemID, "version"), 
              targetAppInfo ? targetAppInfo.minVersion : "",
              targetAppInfo ? targetAppInfo.maxVersion : "",
              this.getItemProperty(aItemID, "name"),
              -1, 
              "", /* XPI Update URL */
              this.getItemProperty(aItemID, "iconURL"), 
              this.getItemProperty(aItemID, "updateURL"), 
              getItemType(r.Value));
    return item;
  },
  
  isProfileItem: function nsExtensionsDataSource_isProfileItem (aItemID)
  {
    return this.getItemProperty(aItemID, "installLocation") != "global";
  },
  
  _setProperty: function nsExtensionsDataSource__setProperty (aDS, aSource, aProperty, aNewValue)
  {
    var oldValue = aDS.GetTarget(aSource, aProperty, true);
    if (oldValue) {
      if (aNewValue)
        aDS.Change(aSource, aProperty, oldValue, aNewValue);
      else
        aDS.Unassert(aSource, aProperty, oldValue);
    }
    else if (aNewValue)
      aDS.Assert(aSource, aProperty, aNewValue, true);
  },
  
  // Given a GUID, get the RDF resource representing the item. This
  // will be of the form urn:mozilla:extension:{GUID} or 
  // urn:mozilla:theme:{GUID} depending on the item type. 
  _getResourceForItem: function nsExtensionsDataSource__getResourceForItem(aItemID)
  {
    var res = null;
    
    // We can try and infer the resource URI from presence in one of the 
    // item lists.
    var rdfc = Components.classes["@mozilla.org/rdf/container;1"]
                         .createInstance(Components.interfaces.nsIRDFContainer);
    rdfc.Init(this, gRDF.GetResource(ROOT_EXTENSION));
    res = gRDF.GetResource(PREFIX_EXTENSION + aItemID);
    if (rdfc.IndexOf(res) != -1)
      return res;
    
    rdfc.Init(this, gRDF.GetResource(ROOT_THEME));
    res = gRDF.GetResource(PREFIX_THEME + aItemID);
    if (rdfc.IndexOf(res) != -1)
      return res;

    return null;
  },

  getTargetApplicationInfo: function nsExtensionsDataSource_getTargetApplicationInfo (aExtensionID, aDataSource, aType)
  {
    var internalName = this.getItemProperty(aExtensionID, "internalName");
    // The default theme is always compatible. 
    if (internalName == KEY_DEFAULT_THEME) {
      var ver = gPref.getCharPref(PREF_EM_APP_EXTENSIONS_VERSION);
      return { minVersion: ver, maxVersion: ver };
    }

    var appID = gPref.getCharPref(PREF_EM_APP_ID);
    var r = gRDF.GetResource(getItemPrefix(aType) + aExtensionID);
    var targetApps = aDataSource.GetTargets(r, this._emR("targetApplication"), true);
    if (!targetApps.hasMoreElements()) {
      r = gRDF.GetResource("urn:mozilla:install-manifest"); 
      targetApps = aDataSource.GetTargets(r, this._emR("targetApplication"), true); 
    }
    while (targetApps.hasMoreElements()) {
      var targetApp = targetApps.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      if (targetApp) {
        try {
          var id = stringData(aDataSource.GetTarget(targetApp, this._emR("id"), true));
          if (id != appID) // Different target application
            continue;
          
          return { minVersion: stringData(aDataSource.GetTarget(targetApp, this._emR("minVersion"), true)),
                   maxVersion: stringData(aDataSource.GetTarget(targetApp, this._emR("maxVersion"), true)) };
        }
        catch (e) { 
          continue;
        }
      }
    }
    return null;
  },
  
  setTargetApplicationInfo: function nsExtensionsDataSource_setTargetApplicationInfo(aExtensionID, aMinVersion, 
                                                                                     aMaxVersion, aDataSource, aType)
  {
    var targetDataSource = aDataSource;
    if (!targetDataSource)
      targetDataSource = this;
      
    var appID = gPref.getCharPref(PREF_EM_APP_ID);
    var r = gRDF.GetResource(getItemPrefix(aType) + aExtensionID);
    var targetApps = targetDataSource.GetTargets(r, this._emR("targetApplication"), true);
    if (!targetApps.hasMoreElements()) {
      r = gRDF.GetResource("urn:mozilla:install-manifest"); 
      targetApps = aDataSource.GetTargets(r, this._emR("targetApplication"), true); 
    }
    while (targetApps.hasMoreElements()) {
      var targetApp = targetApps.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      if (targetApp) {
        var id = stringData(targetDataSource.GetTarget(targetApp, this._emR("id"), true));
        if (id != appID) // Different target application
          continue;
        
        if (!aDataSource) {
          var isProfile = this.isProfileItem(aExtensionID);
          targetDataSource = isProfile ? this._profileExtensions : this._appExtensions;
        }
        this._setProperty(targetDataSource, targetApp, this._emR("minVersion"), this._emL(aMinVersion));
        this._setProperty(targetDataSource, targetApp, this._emR("maxVersion"), this._emL(aMaxVersion));
        
        if (!aDataSource)
          this._flush(isProfile);
      }
    }
  },
  
  getItemProperty: function nsExtensionsDataSource_getItemProperty (aItemID, aProperty)
  { 
    var item = this._getResourceForItem(aItemID);
    if (!item) {
      dump("*** getItemProperty failing for lack of an item. This means getResourceForItem \
                failed to locate a resource for aItemID (item ID = " + aItemID + ", property = " + aProperty + ")\n");
    }
    else 
      return this._getItemProperty(item, aProperty);
    return undefined;
  },
  
  _getItemProperty: function nsExtensionsDataSource__getItemProperty (aItemResource, aProperty)
  {
    try {
      return this.GetTarget(aItemResource, this._emR(aProperty), true).QueryInterface(Components.interfaces.nsIRDFLiteral).Value;
    }
    catch (e) {}
    return "";
  },
  
  setItemProperty: function nsExtensionsDataSource_setItemProperty(
    aItemID, aPropertyArc, aPropertyValue, aIsProfile, aItemType)
  {
    var item = gRDF.GetResource(getItemPrefix(aItemType) + aItemID);
    var ds = aIsProfile ? this._profileExtensions : this._appExtensions;
    this._setProperty(ds, item, aPropertyArc, aPropertyValue);

    this._flush(aIsProfile);  
  },

  insertForthcomingItem: function nsExtensionsDataSource_insertForthcomingItem (aItemID, aItemType, aIsProfile)
  {
    // Get the target container and resource
    var targetDS = aIsProfile ? this._profileExtensions : this._appExtensions;
    var ctr = Components.classes["@mozilla.org/rdf/container;1"]
                        .createInstance(Components.interfaces.nsIRDFContainer);
    ctr.Init(targetDS, gRDF.GetResource(getItemRoot(aItemType)));

    var targetRes = gRDF.GetResource(getItemPrefix(aItemType) + aItemID);
    // Don't bother adding the extension to the list if it's already there. 
    // (i.e. we're upgrading)
    var oldIndex = ctr.IndexOf(targetRes);
    if (oldIndex == -1)
      ctr.AppendElement(targetRes);

    this._flush(aIsProfile);
  }, 

  removeItemFromContainer: function nsExtensionsDataSource_removeItemFromContainer(aItemID, aItemType, aIsProfile)
  {
    var targetDS = aIsProfile ? this._profileExtensions : this._appExtensions;
    var ctr = Components.classes["@mozilla.org/rdf/container;1"]
                        .createInstance(Components.interfaces.nsIRDFContainer);
    ctr.Init(targetDS, gRDF.GetResource(getItemRoot(aItemType)));
    
    var item = gRDF.GetResource(getItemPrefix(aItemType) + aItemID);
    ctr.RemoveElement(item, true);
    
    this._flush(aIsProfile);
  },

  // Removes a corrupt item entry from the extension list added due to 
  // buggy code in previous EM versions!  
  removeCorruptItem: function nsExtensionsDataSource_removeCorruptItem (aItemID, aItemType, aIsProfile)
  {
    this.removeItemMetadata(aItemID, aItemType);
    this.removeItemFromContainer(aItemID, aItemType, aIsProfile);
  },

  // Removes a corrupt download entry from the list.   
  removeCorruptDLItem: function nsExtensionsDataSource_removeCorruptDLItem (aItemURI, aItemType)
  {
    var itemResource = gRDF.GetResource(aItemURI);
    var itemRoot = gRDF.GetResource(getItemRoot(aItemType));
    var dses = [this._profileExtensions, this._appExtensions];
    var isProfile = [true, false];
    for (var i = 0; i < dses.length; ++i) {
      var ctr = Components.classes["@mozilla.org/rdf/container;1"]
                          .createInstance(Components.interfaces.nsIRDFContainer);
      ctr.Init(dses[i], itemRoot);
      if (ctr.IndexOf(itemResource) != -1) {
        ctr.RemoveElement(itemResource, true);
        this._cleanResource(itemResource, dses[i]);
        this._flush(isProfile[i]);
        break;
      }
    }
  },
  
  addItemMetadata: function nsExtensionsDataSource_addItemMetadata (aItemID, aItemType, aSourceDS, aIsProfile)
  {
    var targetDS = aIsProfile ? this._profileExtensions : this._appExtensions;
    var targetRes = gRDF.GetResource(getItemPrefix(aItemType) + aItemID);

    // Copy the assertions over from the source datasource. 
    
    // Assert properties with single values
    var singleProps = ["version", "name", "description", "creator", "homepageURL", 
                       "updateURL", "updateService", "optionsURL", "aboutURL", 
                       "iconURL", "internalName"];

    // Global extensions and themes can also be locked (can't be removed or disabled).
    if (!aIsProfile)
      singleProps = singleProps.concat(["locked"]);
    var sourceRes = gRDF.GetResource("urn:mozilla:install-manifest");
    for (var i = 0; i < singleProps.length; ++i) {
      var property = this._emR(singleProps[i]);
      var literal = aSourceDS.GetTarget(sourceRes, property, true);
      if (!literal)
        continue; // extension didn't specify this property, no big deal, continue.
        
      var val = literal.QueryInterface(Components.interfaces.nsIRDFLiteral).Value;
      
      var oldValue = targetDS.GetTarget(targetRes, property, true);
      if (!oldValue)
        targetDS.Assert(targetRes, property, literal, true);
      else
        targetDS.Change(targetRes, property, oldValue, literal);
    }    

    // Assert properties with multiple values    
    var manyProps = ["contributor"];
    for (var i = 0; i < singleProps.length; ++i) {
      var property = this._emR(manyProps[i]);
      var literals = aSourceDS.GetTargets(sourceRes, property, true);
      
      var oldValues = targetDS.GetTargets(targetRes, property, true);
      while (oldValues.hasMoreElements()) {
        var oldValue = oldValues.getNext().QueryInterface(Components.interfaces.nsIRDFNode);
        targetDS.Unassert(targetRes, property, oldValue);
      }
      while (literals.hasMoreElements()) {
        var literal = literals.getNext().QueryInterface(Components.interfaces.nsIRDFNode);
        targetDS.Assert(targetRes, property, literal, true);
      }
    }
    
    // Version/Dependency Info
    var versionProps = ["targetApplication", "requires"];
    var idRes = this._emR("id");
    var minVersionRes = this._emR("minVersion");
    var maxVersionRes = this._emR("maxVersion");
    for (var i = 0; i < versionProps.length; ++i) {
      var property = this._emR(versionProps[i]);
      var newVersionInfos = aSourceDS.GetTargets(sourceRes, property, true);
      
      var oldVersionInfos = targetDS.GetTargets(targetRes, property, true);
      while (oldVersionInfos.hasMoreElements()) {
        var oldVersionInfo = oldVersionInfos.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        this._cleanResource(oldVersionInfo, targetDS);
        targetDS.Unassert(targetRes, property, oldVersionInfo);
      }
      while (newVersionInfos.hasMoreElements()) {
        var newVersionInfo = newVersionInfos.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        var anon = gRDF.GetAnonymousResource();
        targetDS.Assert(anon, idRes, aSourceDS.GetTarget(newVersionInfo, idRes, true), true);
        targetDS.Assert(anon, minVersionRes, aSourceDS.GetTarget(newVersionInfo, minVersionRes, true), true);
        targetDS.Assert(anon, maxVersionRes, aSourceDS.GetTarget(newVersionInfo, maxVersionRes, true), true);
        targetDS.Assert(targetRes, property, anon, true);
      }
    }
    
    this._flush(aIsProfile);
  },
  
  lockUnlockItem: function nsExtensionsDataSource_lockUnlockItem (aItemID, aLocked)
  {
    var item = this._getResourceForItem(aItemID);
    if (item) {
      var val = aLocked ? this._emL("true") : this._emL("false");
      this.setItemProperty(aItemID, this._emR("locked"), val, false, getItemType(item.Value));
      this._flush(false);
    }
  },  
  
  enableExtension: function nsExtensionsDataSource_enableExtension (aExtensionID)
  {
    this.setItemProperty(aExtensionID, this._emR("toBeEnabled"), 
                         this._emL("true"), this.isProfileItem(aExtensionID), 
                         nsIUpdateItem.TYPE_EXTENSION);
    this.setItemProperty(aExtensionID, this._emR("toBeDisabled"), 
                         null, this.isProfileItem(aExtensionID), 
                         nsIUpdateItem.TYPE_EXTENSION);
    this.setItemProperty(aExtensionID, this._emR("disabled"), 
                         null, this.isProfileItem(aExtensionID), 
                         nsIUpdateItem.TYPE_EXTENSION);
  },
  
  disableExtension: function nsExtensionsDataSource_disableExtension (aExtensionID)
  {
    this.setItemProperty(aExtensionID, this._emR("toBeDisabled"), 
                         this._emL("true"), this.isProfileItem(aExtensionID), 
                         nsIUpdateItem.TYPE_EXTENSION);
    this.setItemProperty(aExtensionID, this._emR("toBeEnabled"), 
                         null, this.isProfileItem(aExtensionID), 
                         nsIUpdateItem.TYPE_EXTENSION);
    this.setItemProperty(aExtensionID, this._emR("disabled"), 
                         this._emL("true"), this.isProfileItem(aExtensionID), 
                         nsIUpdateItem.TYPE_EXTENSION);
  },
  
  uninstallExtension: function nsExtensionsDataSource_uninstallExtension (aExtensionID)
  {
    // We have to do this check BEFORE we unhook all the metadata from this 
    // extension's resource, otherwise we'll think it's a global extension.
    var isProfile = this.isProfileItem(aExtensionID);
    
    this.setItemProperty(aExtensionID, this._emR("toBeInstalled"), 
                         null, isProfile, 
                         nsIUpdateItem.TYPE_EXTENSION);
    this.setItemProperty(aExtensionID, this._emR("toBeUninstalled"), 
                         this._emL("true"), isProfile, 
                         nsIUpdateItem.TYPE_EXTENSION);
    this._flush(isProfile);
  },
  
  doneInstallingTheme: function nsExtensionsDataSource_doneInstallingTheme (aThemeID)
  {
    // Notify observers of a change in the iconURL property to cause the UI to
    // refresh.
    var theme = this._getResourceForItem(aThemeID);
    var iconURLArc = this._emR("iconURL");
    var iconURL = this.GetTarget(theme, iconURLArc, true);
    if (theme, iconURLArc, iconURL) {
      for (var i = 0; i < this._observers.length; ++i)
        this._observers[i].onAssert(this, theme, iconURLArc, iconURL);
    }
  },
  
  enableTheme: function nsExtensionsDataSource_enableTheme (aThemeID)
  {
    this.setItemProperty(aThemeID, this._emR("disabled"), 
                         null, this.isProfileItem(aThemeID), 
                         nsIUpdateItem.TYPE_THEME);
  },
    
  disableTheme: function nsExtensionsDataSource_disableTheme (aThemeID)
  {
    this.setItemProperty(aThemeID, this._emR("disabled"), 
                         this._emL("true"), this.isProfileItem(aThemeID), 
                         nsIUpdateItem.TYPE_THEME);
  },
  
  uninstallTheme: function nsExtensionsDataSource_uninstallTheme(aThemeID)
  {
    // We have to do this check BEFORE we unhook all the metadata from this 
    // extension's resource, otherwise we'll think it's a global extension.
    var isProfile = this.isProfileItem(aThemeID);
        
    // Clean the extension resource
    this.removeItemMetadata(aThemeID, nsIUpdateItem.TYPE_THEME);
    
    var uninstaller = new nsThemeUninstaller(this);
    uninstaller.uninstall(aThemeID, isProfile);  
    
    // Do this LAST since inferences are made about an item based on
    // what container it's in.
    this.removeItemFromContainer(aThemeID, nsIUpdateItem.TYPE_THEME, isProfile);
  },
  
  // Cleans the resource of all its assertionss
  removeItemMetadata: function nsExtensionsDataSource_removeItemMetadata (aItemID, aItemType)
  {
    var item = gRDF.GetResource(getItemPrefix(aItemType) + aItemID);
    var isProfile = this.isProfileItem(aItemID);
    var ds = isProfile ? this._profileExtensions : this._appExtensions;
    
    var resources = ["targetApplication", "requires"];
    for (var i = 0; i < resources.length; ++i) {
      var targetApps = ds.GetTargets(item, this._emR(resources[i]), true);
      while (targetApps.hasMoreElements()) {
        var targetApp = targetApps.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
        this._cleanResource(targetApp, ds);
      }
    }

    this._cleanResource(item, ds);
  },
  
  _cleanResource: function nsExtensionsDataSource__cleanResource (aResource, aDS)
  {
    // Remove outward arcs
    var arcs = aDS.ArcLabelsOut(aResource);
    while (arcs.hasMoreElements()) {
      var arc = arcs.getNext().QueryInterface(Components.interfaces.nsIRDFResource);
      var value = aDS.GetTarget(aResource, arc, true);
      if (value)
        aDS.Unassert(aResource, arc, value);
    }
  },
  
  moveTop: function nsExtensionsDataSource_moveTop (aItemID)
  {
    var extensions = gRDF.GetResource("urn:mozilla:extension:root");
    var item = this._getResourceForItem(aItemID);
    var ds = this._getTargetDSFromSource(item);
    var container = Components.classes["@mozilla.org/rdf/container;1"]
                              .createInstance(Components.interfaces.nsIRDFContainer);
    container.Init(ds, extensions);
    
    var index = container.IndexOf(item);
    if (index > 1) {
      container.RemoveElement(item, false);
      container.InsertElementAt(item, 1, true);
    }
    this._flush(this.isProfileItem(aItemID));
  },
  
  moveUp: function nsExtensionsDataSource_moveUp (aItemID)
  {
    var extensions = gRDF.GetResource("urn:mozilla:extension:root");
    var item = this._getResourceForItem(aItemID);
    var ds = this._getTargetDSFromSource(item);
    var container = Components.classes["@mozilla.org/rdf/container;1"]
                              .createInstance(Components.interfaces.nsIRDFContainer);
    container.Init(ds, extensions);
    
    var item = this._getResourceForItem(aItemID);
    var index = container.IndexOf(item);
    if (index > 1) {
      container.RemoveElement(item, false);
      container.InsertElementAt(item, index - 1, true);
    }
    this._flush(this.isProfileItem(aItemID));
  },
  
  moveDown: function nsExtensionsDataSource_moveDown (aItemID)
  {
    var extensions = gRDF.GetResource("urn:mozilla:extension:root");
    var item = this._getResourceForItem(aItemID);
    var ds = this._getTargetDSFromSource(item);
    var container = Components.classes["@mozilla.org/rdf/container;1"]
                              .createInstance(Components.interfaces.nsIRDFContainer);
    container.Init(ds, extensions);
    
    var item = this._getResourceForItem(aItemID);
    var index = container.IndexOf(item);
    var count = container.GetCount();
    if (index < count) {
      container.RemoveElement(item, true);
      container.InsertElementAt(item, index + 1, true);
    }
    this._flush(this.isProfileItem(aItemID));
  },
  
  isDownloadItem: function nsExtensionsDataSource_isDownloadItem (aItemID)
  {
    return this.getItemProperty(aItemID, "downloadURL") != "";
  },

  addDownload: function nsExtensionsDataSource_addDownload (aName, aURL, aIconURL, aItemType)
  {
    var root = gRDF.GetResource(getItemRoot(aItemType));
    
    var res = gRDF.GetResource(aURL);
    this._setProperty(this._profileExtensions, res, 
                      this._emR("name"),
                      gRDF.GetLiteral(aName))
    this._setProperty(this._profileExtensions, res, 
                      this._emR("version"),
                      gRDF.GetLiteral(" "));
    this._setProperty(this._profileExtensions, res, 
                      this._emR("iconURL"),
                      gRDF.GetLiteral(aIconURL));
    this._setProperty(this._profileExtensions, res, 
                      this._emR("downloadURL"),
                      gRDF.GetLiteral(aURL));

    var ctr = Components.classes["@mozilla.org/rdf/container;1"]
                        .createInstance(Components.interfaces.nsIRDFContainer);
    ctr.Init(this._profileExtensions, root);
    if (ctr.IndexOf(res) == -1)
      ctr.InsertElementAt(res, 1, true);
    
    this._flush(true);
  },
  
  removeDownload: function nsExtensionsDataSource_removeDownload (aURL, aItemType)
  {
    var root = gRDF.GetResource(getItemRoot(aItemType));
    var res = gRDF.GetResource(aURL);
    var ctr = Components.classes["@mozilla.org/rdf/container;1"]
                        .createInstance(Components.interfaces.nsIRDFContainer);
    ctr.Init(this._profileExtensions, root);
    ctr.RemoveElement(res, true);
    this._cleanResource(res, this._profileExtensions);
    
    this._flush(true);
  },
    
  flushProgressInfo: function nsExtensionsDataSource_flushProgressInfo (aData)
  {
    for (var url in aData) {
      var res = gRDF.GetResource(url);
      this._setProperty(this._profileExtensions, res, 
                        this._emR("state"),
                        gRDF.GetIntLiteral(aData[url].state));
      this._setProperty(this._profileExtensions, res, 
                        this._emR("progress"),
                        gRDF.GetIntLiteral(aData[url].progress));
    }
    this._flush(true);
  },   
   
  loadExtensions: function nsExtensionsDataSource_loadExtensions (aProfile)
  {
    var extensionsFile  = getFile(getDirKey(aProfile), 
                                  [DIR_EXTENSIONS, FILE_EXTENSIONS]);
    ensureExtensionsFiles(aProfile);

    var ds = gRDF.GetDataSourceBlocking(getURLSpecFromFile(extensionsFile));
    if (aProfile) {
      this._profileExtensions = ds;
      if (!this._composite) 
        this._composite = Components.classes["@mozilla.org/rdf/datasource;1?name=composite-datasource"]
                                    .createInstance(Components.interfaces.nsIRDFDataSource);
      if (this._appExtensions)
        this._composite.RemoveDataSource(this._appExtensions);
      this._composite.AddDataSource(this._profileExtensions);
      if (this._appExtensions)
        this._composite.AddDataSource(this._appExtensions);  
    }
    else {
      this._appExtensions = ds;
      
      if (!this._composite)
        this._composite = Components.classes["@mozilla.org/rdf/datasource;1?name=composite-datasource"]
                                    .createInstance(Components.interfaces.nsIRDFCompositeDataSource);
      this._composite.AddDataSource(this._appExtensions);
    }
  },
  
  /////////////////////////////////////////////////////////////////////////////
  // nsIRDFDataSource
  get URI()
  {
    return "rdf:extensions";
  },
  
  GetSource: function nsExtensionsDataSource_GetSource (aProperty, aTarget, aTruthValue)
  {
    return this._composite.GetSource(aProperty, aTarget, aTruthValue);
  },
  
  GetSources: function nsExtensionsDataSource_GetSources (aProperty, aTarget, aTruthValue)
  {
    return this._composite.GetSources(aProperty, aTarget, aTruthValue);
  },
  
  _getThemeJARURL: function nsExtensionsDataSource__getThemeJARURL (aSource, aFileName, aFallbackURL)
  {
    var id = stripPrefix(aSource.Value, nsIUpdateItem.TYPE_THEME);
    var chromeDir = getDir(this.isProfileItem(id) ? KEY_PROFILEDIR : KEY_APPDIR, 
                            [DIR_EXTENSIONS, id, DIR_CHROME]);

    var jarFile = null;
    // XXXben hack for pre-configured classic.jar
    if ((!chromeDir.exists() || !chromeDir.directoryEntries.hasMoreElements()) &&
        aSource.EqualsNode(gRDF.GetResource("urn:mozilla:theme:{972ce4c6-7e08-4474-a285-3208198ce6fd}")))
      jarFile = getFile(KEY_APPDIR, ["chrome", "classic.jar"]);
    if (chromeDir.directoryEntries.hasMoreElements() || jarFile) {
      if (!jarFile)
        jarFile = chromeDir.directoryEntries.getNext().QueryInterface(Components.interfaces.nsIFile);

      if (jarFile.exists()) {
        var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"]
                                  .createInstance(Components.interfaces.nsIZipReader);
        zipReader.init(jarFile);
        zipReader.open();
        var url = aFallbackURL;
        try {
          zipReader.getEntry(aFileName);
          url = "jar:" + getURLSpecFromFile(jarFile) + "!/" + aFileName; 
        }
        catch (e) { }
        zipReader.close();
        
        if (url)
          return gRDF.GetResource(url);
      }
    }
    return null;
  },
  
  GetTarget: function nsExtensionsDataSource_GetTarget(aSource, aProperty, aTruthValue)
  {
    if (!aSource)
      return null;
      
    if (aProperty.EqualsNode(this._emR("iconURL"))) {
      var itemType = getItemType(aSource.Value);
      if (itemType != -1 && itemType & nsIUpdateItem.TYPE_EXTENSION) {
        var hasIconURL = this._composite.hasArcOut(aSource, aProperty);
        // If the download entry doesn't have a IconURL property, use a
        // generic icon URL instead.
        if (!hasIconURL)
          return gRDF.GetResource("chrome://mozapps/skin/xpinstall/xpinstallItemGeneric.png");
        else {
          var iconURL = this._composite.GetTarget(aSource, aProperty, true);
          iconURL = iconURL.QueryInterface(Components.interfaces.nsIRDFLiteral).Value;
          var cr = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
                             .getService(Components.interfaces.nsIChromeRegistry);
          var ioServ = Components.classes["@mozilla.org/network/io-service;1"]
                                 .getService(Components.interfaces.nsIIOService);
          var uri = ioServ.newURI(iconURL, null, null);
          try {
            cr.convertChromeURL(uri);
          }
          catch(e) {
            // bogus URI, supply a generic icon. 
            return gRDF.GetResource("chrome://mozapps/skin/xpinstall/xpinstallItemGeneric.png");
          }
        }
      }
      else if (itemType != -1 && itemType & nsIUpdateItem.TYPE_THEME) {
        var res = this._getThemeJARURL(aSource, "icon.png", "chrome://mozapps/skin/extensions/themeGeneric.png");
        if (res)
          return res;
      }
    }
    else if (aProperty.EqualsNode(this._emR("previewImage"))) {
      var itemType = getItemType(aSource.Value);
      if (itemType != -1 && itemType & nsIUpdateItem.TYPE_THEME) {
        var res = this._getThemeJARURL(aSource, "preview.png", null);
        if (res)
          return res;
      }
    }
    else if (aProperty.EqualsNode(this._emR("installLocation"))) {
      var arcs = this._profileExtensions.ArcLabelsOut(aSource);
      return arcs.hasMoreElements() ? this._emL("profile") : this._emL("global");
    }
    else if (aProperty.EqualsNode(this._emR("disabled"))) {
      if (this.safeMode) 
        return this._emL("true");
      // fall through to default.
    }
    else if (aProperty.EqualsNode(this._emR("itemType"))) {
      // We can try and infer the type from presence in one of the 
      // item lists.
      var rdfc = Components.classes["@mozilla.org/rdf/container;1"]
                          .createInstance(Components.interfaces.nsIRDFContainer);
      rdfc.Init(this, gRDF.GetResource(ROOT_EXTENSION));
      if (rdfc.IndexOf(aSource) != -1) 
        return this._emL("extension");
    
      rdfc.Init(this, gRDF.GetResource(ROOT_THEME));
      if (rdfc.IndexOf(aSource) != -1) 
        return this._emL("theme");
    }
    else if (aProperty.EqualsNode(this._emR("compatible"))) {
      var type = getItemType(aSource.Value);
      var id = stripPrefix(aSource.Value, type);
      var targetAppInfo = this.getTargetApplicationInfo(id, this, type);
      if (!targetAppInfo)
        return this._emL("false");
      getVersionChecker();
      
      var appVersion = gPref.getCharPref(PREF_EM_APP_EXTENSIONS_VERSION);
      if (gVersionChecker.compare(targetAppInfo.maxVersion, appVersion) < 0 || 
          gVersionChecker.compare(appVersion, targetAppInfo.minVersion) < 0) {
        // OK, this item is incompatible. 
        return this._emL("false");
      }
      return this._emL("true");
    }
    else if (aProperty.EqualsNode(this._emR("displayDescription"))) {
      // We have a separate property for the description of the extension items
      // which is displayed in the EM list - because we overload this value with
      // alternative messages when the extension is disabled because of 
      // incompatibility.
      var disabled = this.getItemProperty(stripPrefix(aSource.Value, getItemType(aSource.Value)), 
                                          "disabled");
      if (disabled == "true") {
        // See if this item was disabled because it was incompatible. 
        // XXXben potential visual-glitch bug here with extensions whose install.rdf 
        //        manifests state that they are incompatible but when phone home checking
        //        reveals that they are compatible and they are installed the 
        //        incompatible metadata is written anyway and will remain in the ds
        //        until the next background update check corrects it - this means that
        //        when a compatible extension is installed in this manner it is 
        //        likely that when it is disabled it will show this special-case
        //        error message.
        var compatible = this.getItemProperty(stripPrefix(aSource.Value, getItemType(aSource.Value)), 
                                              "compatible");
        if (compatible != "true") {
          var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"]
                              .getService(Components.interfaces.nsIStringBundleService);
          var extensionStrings = sbs.createBundle("chrome://mozapps/locale/extensions/extensions.properties");
          var brandStrings = sbs.createBundle("chrome://global/locale/brand.properties");
          var brandShortName = brandStrings.GetStringFromName("brandShortName");
          var appVersion = gPref.getCharPref(PREF_EM_APP_VERSION);
          var incompatibleMessage = extensionStrings.formatStringFromName("incompatibleExtension", 
                                                                          [brandShortName, appVersion], 2);
          return this._emL(incompatibleMessage);
        }
      }
      // Use the "description" property. 
      return this.GetTarget(aSource, this._emR("description"), aTruthValue);
    }
    else if (aProperty.EqualsNode(this._emR("name")) || 
             aProperty.EqualsNode(this._emR("description")) || 
             aProperty.EqualsNode(this._emR("creator")) || 
             aProperty.EqualsNode(this._emR("homepageURL"))) {
      // These are localizable properties that a language pack supplied by the 
      // Extension may override.          
      var prefName = PREF_EM_EXTENSION_FORMAT.replace(/%UUID%/, 
                                                      stripPrefix(aSource.Value, 
                                                                  nsIUpdateItem.TYPE_EXTENSION)) + 
                      stripPropertyPrefix(aProperty.Value, EM_NS_PREFIX);
      try {
        var value = gPref.getComplexValue(prefName, 
                                          Components.interfaces.nsIPrefLocalizedString);
        if (value.data) 
          return this._emL(value.data);
      }
      catch (e) {
      }
    }
    
    return this._composite.GetTarget(aSource, aProperty, aTruthValue);
  },
  
  GetTargets: function nsExtensionsDataSource_GetTargets (aSource, aProperty, aTruthValue)
  {
    if (aProperty.EqualsNode(this._emR("name")) ||
        aProperty.EqualsNode(this._emR("contributor"))) {
      // These are localizable properties that a language pack supplied by the 
      // Extension may override.          
      var contributors = [];
      var prefName = PREF_EM_EXTENSION_FORMAT.replace(/%UUID%/, 
                                                      stripPrefix(aSource.Value, 
                                                                  nsIUpdateItem.TYPE_EXTENSION)) + 
                      stripPropertyPrefix(aProperty.Value, EM_NS_PREFIX);
      var i = 0;
      do {
        try {
          var value = gPref.getComplexValue(prefName + "." + ++i, 
                                            Components.interfaces.nsIPrefLocalizedString);
          if (value.data) 
            contributors.push(this._emL(value.data));
        }
        catch (e) {
          try {
            var value = gPref.getComplexValue(prefName, 
                                              Components.interfaces.nsIPrefLocalizedString);
            if (value.data) 
              contributors.push(this._emL(value.data));
          }
          catch (e) {
          }
          break;
        }
      }
      while (1);
      if (contributors.length > 0)
        return new ArrayEnumerator(contributors);
    }
    return this._composite.GetTargets(aSource, aProperty, aTruthValue);
  },
  
  _getTargetDSFromSource: function nsExtensionsDataSource__getTargetDSFromSource (aSource)
  {
    var itemID = stripPrefix(aSource.Value, nsIUpdateItem.TYPE_ADDON);
    return this.isProfileItem(itemID) ? this._profileExtensions : this._appExtensions;
  },
  
  Assert: function nsExtensionsDataSource_Assert (aSource, aProperty, aTarget, aTruthValue)
  {
    var targetDS = this._getTargetDSFromSource(aSource);
    targetDS.Assert(aSource, aProperty, aTarget, aTruthValue);
  },
  
  Unassert: function nsExtensionsDataSource_Unassert (aSource, aProperty, aTarget)
  {
    var targetDS = this._getTargetDSFromSource(aSource);
    targetDS.Unassert(aSource, aProperty, aTarget);
  },
  
  Change: function nsExtensionsDataSource_Change (aSource, aProperty, aOldTarget, aNewTarget)
  {
    var targetDS = this._getTargetDSFromSource(aSource);
    targetDS.Change(aSource, aProperty, aOldTarget, aNewTarget);
  },

  Move: function nsExtensionsDataSource_Move (aSource, aNewSource, aProperty, aTarget)
  {
    var targetDS = this._getTargetDSFromSource(aSource);
    targetDS.Move(aSource, aNewSource, aProperty, aTarget);
  },
  
  HasAssertion: function nsExtensionsDataSource_HasAssertion (aSource, aProperty, aTarget, aTruthValue)
  {
    if (!aSource || !aProperty || !aTarget)
      return false;
    return this._composite.HasAssertion(aSource, aProperty, aTarget, aTruthValue);
  },
  
  _observers: [],
  AddObserver: function nsExtensionsDataSource_AddObserver (aObserver)
  {
    for (var i = 0; i < this._observers.length; ++i) {
      if (this._observers[i] == aObserver) 
        return;
    }
    this._observers.push(aObserver);
    this._composite.AddObserver(aObserver);
  },
  
  RemoveObserver: function nsExtensionsDataSource_RemoveObserver (aObserver)
  {
    for (var i = 0; i < this._observers.length; ++i) {
      if (this._observers[i] == aObserver) 
        this._observers.splice(i, 1);
    }
    this._composite.RemoveObserver(aObserver);
  },
  
  ArcLabelsIn: function nsExtensionsDataSource_ArcLabelsIn (aNode)
  {
    return this._composite.ArcLabelsIn(aNode);
  },
  
  ArcLabelsOut: function nsExtensionsDataSource_ArcLabelsOut (aSource)
  {
    return this._composite.ArcLabelsOut(aSource);
  },
  
  GetAllResources: function nsExtensionsDataSource_GetAllResources ()
  {
    return this._composite.GetAllResources();
  },
  
  IsCommandEnabled: function nsExtensionsDataSource_IsCommandEnabled (aSources, aCommand, aArguments)
  {
    return this._composite.IsCommandEnabled(aSources, aCommand, aArguments);
  },
  
  DoCommand: function nsExtensionsDataSource_DoCommand (aSources, aCommand, aArguments)
  {
    this._composite.DoCommand(aSources, aCommand, aArguments);
  },
  
  GetAllCmds: function nsExtensionsDataSource_GetAllCmds (aSource)
  {
    return this._composite.GetAllCmds(aSource);
  },
  
  hasArcIn: function nsExtensionsDataSource_hasArcIn (aNode, aArc)
  {
    return this._composite.hasArcIn(aNode, aArc);
  },
  
  hasArcOut: function nsExtensionsDataSource_hasArcOut (aSource, aArc)
  {
    return this._composite.hasArcOut(aSource, aArc);
  },
  
  beginUpdateBatch: function nsExtensionsDataSource_beginUpdateBatch ()
  {
    return this._composite.beginUpdateBatch();
  },
  
  endUpdateBatch: function nsExtensionsDataSource_endUpdateBatch ()
  {
    return this._composite.endUpdateBatch();
  },
  
  /////////////////////////////////////////////////////////////////////////////
  // nsIRDFRemoteDataSource
  
  get loaded()
  {
    throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
  },
  
  Init: function nsExtensionsDataSource_Init (aURI)
  {
  },
  
  Refresh: function nsExtensionsDataSource_Refresh (aBlocking)
  {
  },
  
  Flush: function nsExtensionsDataSource_Flush ()
  {
    this._flush(false);
    this._flush(true);
  },
  
  FlushTo: function nsExtensionsDataSource_FlushTo (aURI)
  {
  },
  
  _flush: function nsExtensionsDataSource__flush (aIsProfile)
  { 
    var ds = aIsProfile ? this._profileExtensions : this._appExtensions;
    var rds = ds.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
    rds.Flush();
  },

  /////////////////////////////////////////////////////////////////////////////
  // nsISupports
  QueryInterface: function nsExtensionsDataSource_QueryInterface (aIID) 
  {
    if (!aIID.equals(Components.interfaces.nsIRDFDataSource) &&
        !aIID.equals(Components.interfaces.nsIRDFRemoteDataSource) && 
        !aIID.equals(Components.interfaces.nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};


var gModule = {
  _firstTime: true,
  
  registerSelf: function (aComponentManager, aFileSpec, aLocation, aType) 
  {
    if (this._firstTime) {
      this._firstTime = false;
      throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
    }
    aComponentManager = aComponentManager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    
    for (var key in this._objects) {
      var obj = this._objects[key];
      aComponentManager.registerFactoryLocation(obj.CID, obj.className, obj.contractID,
                                                aFileSpec, aLocation, aType);
    }

/*    
    // Make the Extension Manager a startup observer
    var categoryManager = Components.classes["@mozilla.org/categorymanager;1"]
                                    .getService(Components.interfaces.nsICategoryManager);
    categoryManager.addCategoryEntry("app-startup", this._objects.manager.className,
                                     "service," + this._objects.manager.contractID, 
                                     true, true, null);
 */
  },
  
  getClassObject: function (aComponentManager, aCID, aIID) 
  {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    for (var key in this._objects) {
      if (aCID.equals(this._objects[key].CID))
        return this._objects[key].factory;
    }
    
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },
  
  _objects: {
    manager: { CID        : nsExtensionManager.prototype.classID,
               contractID : nsExtensionManager.prototype.contractID,
               className  : nsExtensionManager.prototype.classDescription,
               factory    : {
                              createInstance: function (aOuter, aIID) 
                              {
                                if (aOuter != null)
                                  throw Components.results.NS_ERROR_NO_AGGREGATION;
                                
                                return (new nsExtensionManager()).QueryInterface(aIID);
                              }
                            }
             }
   },
  
  canUnload: function (aComponentManager) 
  {
    return true;
  }
};

function NSGetModule(compMgr, fileSpec) 
{
  return gModule;
}
