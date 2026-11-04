import initialDesign from './design.json' with {type:'json'};
import {buildModel} from './build-model.js';
// The editable workshop and offline export share the same geometry builder.
export function createWallStudy(design=initialDesign){return buildModel(design);}
