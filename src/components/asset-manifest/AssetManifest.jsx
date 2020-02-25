import React from "react";

import mockManifest from "./mock-manifest";

import {
    generateModuleNoModuleScriptBlocks,
    getAbsoluteHashedAssetPath
} from "../../module-no-module-asset-manifest.server-side";

Promise.all([
    getAbsoluteHashedAssetPath("styles.css", "modern"),
    getAbsoluteHashedAssetPath("styles.css", "legacy")
]).then(([modernPath, legacyPath]) => {
    console.warn(modernPath);
    console.warn(legacyPath);
});

generateModuleNoModuleScriptBlocks().then(
    ({
        moduleSupportedScript,
        crossBrowserModuleNoModuleLoaderScript,
        modulePreloadTags
    }) => {
        console.warn(moduleSupportedScript);
        console.warn(crossBrowserModuleNoModuleLoaderScript);
        console.warn(modulePreloadTags);
    }
);

const AssetManifest = () => <pre>{JSON.stringify(mockManifest, null, 2)}</pre>;

export default AssetManifest;
