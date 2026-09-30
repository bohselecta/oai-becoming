/** Rendering fixtures only. No production debug API is added to the application. */
import {initialState,setSource} from '../src/domain.js';
const low=initialState(),high=initialState(),partial=initialState(),unknown=initialState();
for(const e of low.evidence)e.mark=0;
for(const e of high.evidence)e.mark=4;
low.history=[];high.history=[];
partial.evidence=partial.evidence.filter(e=>e.skill==='systems');partial.history=[];
for(const id of ['projects','portfolio','practice'])setSource(unknown,id,false);
console.log(JSON.stringify({low,high,partial,unknown}));
