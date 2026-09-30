/** Deterministic, fictional people, not samples of any real population.
 * Reference memberships are declared fixture attributes, never inferred traits.
 * A production adapter must supply authorized observations using this shape.
 */
export const REFERENCE_VERSION = 'synthetic-participants/2@2026-09-30';
export const REFERENCE_DATE = '2026-09-30';
export const PROTOCOL = 'becoming-demonstration/1';
export const referenceCohorts = [
  {id:'global', name:'All comparable participants', label:'All participants', detail:'120 fictional participating adults; not the world population.', n:120},
  {id:'national', name:'United States participants', label:'United States', detail:'80 fictional US participants; not a national estimate.', n:80},
  {id:'region', name:'Texas participants', label:'Texas', detail:'40 fictional regional participants; not a regional estimate.', n:40},
  {id:'profession', name:'Software professionals', label:'Software professionals', detail:'75 fictional participants with this declared profession.', n:75},
  {id:'specialty', name:'Creative developers', label:'Creative development', detail:'40 fictional participants with this declared specialty.', n:40},
  {id:'senior', name:'Senior software professionals', label:'Senior software', detail:'30 fictional participants with this declared experience level.', n:30},
  {id:'aspiration', name:'People entering creative development', label:'Entering creative development', detail:'40 fictional participants sharing this aspiration.', n:40},
  {id:'circle', name:'Chosen practice circle', label:'Chosen circle · small', detail:'12 fictional followed participants. Aggregate percentile withheld below 30.', n:12}
];
const capabilityIds = ['systems','research','story','prototype','facilitation','creative'];
const first = ['Rowan','Mira','Ellis','Noor','Avery','Sage','Ren','Jules','Morgan','Quinn','Ira','Remy'];
const last = ['Vale','Chen','Park','Rivera','Sato','Reed','Bennett','Shah','Marin','Wells'];
const clamp = x => Math.min(4, Math.max(0, x));
function marksFor(mean) {
  const total = Math.round(clamp(mean) * 12), floor = Math.floor(total / 12), remainder = total % 12;
  return Array.from({length:12}, (_,j) => floor + (j < remainder ? 1 : 0));
}
export const participants = Array.from({length:120}, (_,i) => {
  const id = `demo-person-${String(i+1).padStart(3,'0')}`;
  const memberships = ['global'];
  if (i % 3 !== 2) memberships.push('national');
  if (i % 3 === 0) memberships.push('region');
  if (i >= 45) memberships.push('profession');
  if (i >= 60 && i < 100) memberships.push('specialty');
  if (i >= 90) memberships.push('senior');
  if (i < 40) memberships.push('aspiration');
  if (i % 10 === 0) memberships.push('circle');
  const observations = Object.fromEntries(['independent','assisted'].map(mode => [mode,
    Object.fromEntries(capabilityIds.map((skill,j) => {
      const mean = .65 + 3.05 * Math.pow(i/119, .88) + .32*Math.sin((i+j*11)*1.7)
        + [.32,-.04,.12,.28,-.08,.20][j] + (mode === 'assisted' ? .45 : 0);
      return [skill, {rubric:'becoming-demo/1', protocol:PROTOCOL, mode, synthetic:true,
        observedAt:REFERENCE_DATE, accepted:true, marks:marksFor(mean),
        assessmentId:`${id}/${skill}/${mode}/1`, source:`fixture://${REFERENCE_VERSION}/${id}`}];
    }))
  ]));
  return {id, schema:'becoming-participant/1', displayName:`${first[i%12]} ${last[Math.floor(i/12)]}`,
    kind:'synthetic', synthetic:true, referenceVersion:REFERENCE_VERSION, asOf:REFERENCE_DATE,
    subtitle:i>=90?'Senior software practitioner':i>=45?'Software & product practitioner':'Creative development participant',
    permission:{basis:'authored-synthetic-fixture', compare:true, profile:true, practices:true},
    cohorts:memberships, observations, sharedBundles:['investigator', ['builder','storyteller','facilitator'][i%3]],
    notice:'Fictional person. No identity, likeness, or measurements of a real person.'};
});
