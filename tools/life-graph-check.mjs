export default async function run(page) {
  await page.evaluate(() => {window.confirm=()=>true;});
  await page.waitForFunction(() => document.querySelectorAll('#lg-content .lg-event').length === 9);
  const result = await page.evaluate(() => {
    const stats = { title: document.title, atHomeAfterHero: !!document.querySelector('.hero + #life-graph'), initialEvents: document.querySelectorAll('#lg-content .lg-event').length, age: document.querySelector('#lg-age')?.textContent, chapters: document.querySelector('#lg-chapters')?.textContent };
    document.querySelector('[data-lg-view="graph"]').click(); stats.graphMode = !!document.querySelector('.lg-trajectory'); stats.chartMarkers = document.querySelectorAll('.lg-hit-wrap').length; stats.undatedCount = document.querySelectorAll('.lg-undated-item').length;
    document.querySelector('[data-lg-view="map"]').click(); stats.mapMode = !!document.querySelector('.lg-map');
    document.querySelector('[data-lg-view="timeline"]').click();
    document.querySelector('#lg-category').value = 'Music'; document.querySelector('#lg-category').dispatchEvent(new Event('change',{bubbles:true})); stats.musicFilterCount = document.querySelectorAll('#lg-content .lg-event').length;
    document.querySelector('#lg-category').value = 'all'; document.querySelector('#lg-category').dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#lg-search').value = 'TURNING POINT'; document.querySelector('#lg-search').dispatchEvent(new Event('input',{bubbles:true})); stats.searchCount = document.querySelectorAll('#lg-content .lg-event').length;
    document.querySelector('#lg-search').value = ''; document.querySelector('#lg-search').dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('[data-open="seed-teenage-limits"]').click(); stats.detailOpens = !document.querySelector('#lg-detail').hidden; stats.detailHasNoFakeDate = document.querySelector('#lg-detail').innerText.includes('ปีไม่ระบุ');
    document.querySelector('#lg-detail [data-edit]').click(); stats.editDialog = document.querySelector('#lg-dialog').open;
    document.querySelector('#lg-dialog [data-cancel]').click(); stats.dialogClosed = !document.querySelector('#lg-dialog').open;
    document.querySelector('[data-add]').click(); const f=document.querySelector('#lg-form');f.elements.title.value='QA temporary milestone';f.elements.description.value='browser test';f.elements.category.value='Music';f.elements.chapterId.value='music-artist';f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));stats.createWorks=document.querySelectorAll('#lg-content .lg-event').length===10;
    stats.persistedAfterRefresh=JSON.parse(localStorage.getItem('et1cruel.life-graph.v1')).records.some(r=>r.title==='QA temporary milestone');
    stats.deleteControlPresent=!!document.querySelector('#lg-detail [data-delete]'); stats.deleteConfirmationRequired=!!document.querySelector('#lg-detail [data-delete]')&&document.querySelector('#lg-detail [data-delete]').textContent.trim()==='ลบ';
    stats.heroPresent = !!document.querySelector('.hero'); stats.oldQuestTextPresent = document.querySelector('.hero').innerText.includes('58 QUESTS');
    return stats;
  });
  const errors=[];
  for(const [k,v] of Object.entries(result)) if(typeof v==='boolean' && !v) errors.push(k);
  if(result.initialEvents!==9 || result.chartMarkers!==4 || result.undatedCount!==4 || result.musicFilterCount<1 || result.searchCount!==1) errors.push('counts');
  if(errors.length) throw new Error('Failed checks: '+errors.join(', ')+' :: '+JSON.stringify(result));
  return result;
}
