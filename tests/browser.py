"""Real Chromium tests against the exact standalone build; navigation is not mocked.

Run `npm run build` first. The browser uses a per-test localStorage substitute because
about:blank does not expose persistent localStorage. This does not validate the public GitHub Pages HTTP endpoint.
"""
from pathlib import Path
import json
import os
import unittest
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
BUILD=(ROOT/'dist/index.html')
SAVE='solo-save-v1'
DEFAULT={
 'version':2,'x':1070,'y':3540,'face':0,'health':100,'hunger':84,'thirst':78,
 'stamina':100,'warmth':100,'days':0,'kills':0,
 'inventory':{'wood':3,'stone':2,'berry':4,'water':3,'can':1,'seed':4,'shirt':1,'pants':1,'boots':1,'knife':1,'bandage':2},
 'equipment':{'head':None,'body':'shirt','legs':'pants','feet':'boots','back':None,'hand':'knife'},
 'condition':{'knife':65},'looted':{},'harvested':{},'plots':{},'fires':{},'animals':{},
 'marker':None,'ground':[],'nextGroundId':1,'deathCount':0,'lastSave':0,
}

class BrowserTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.playwright=sync_playwright().start()
  default='/usr/bin/chromium'
  cls.browser=cls.playwright.chromium.launch(headless=True,executable_path=default if Path(default).exists() else None,args=['--no-sandbox','--disable-dev-shm-usage'])
  cls.html=BUILD.read_text(encoding='utf8')

 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.playwright.stop()

 def setUp(self):self.pages=[]
 def tearDown(self):
  for page in self.pages:page.context.close()

 def boot(self,state=None,viewport=(1280,720),touch=False,legacy=False):
  context=self.browser.new_context(viewport={'width':viewport[0],'height':viewport[1]},has_touch=touch,is_mobile=touch,device_scale_factor=1)
  page=context.new_page();self.pages.append(page);errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  entries={}
  if state is not None:entries['ultimo-viandante-survival-v2' if legacy else SAVE]=json.dumps(state)
  prelude="""<script>const __store=new Map(%s);Object.defineProperty(window,'localStorage',{value:{getItem:k=>__store.get(k)||null,setItem:(k,v)=>__store.set(k,String(v)),removeItem:k=>__store.delete(k)}});</script>""" % json.dumps(list(entries.items()))
  html=self.html.replace("<script type=\"module\">import 'solo/app/game.js';</script>",prelude+"<script type=\"module\">import 'solo/app/game.js';</script>")
  page.set_content(html,wait_until='load');page.wait_for_function('window.__survivalStatus?.loaded===true',timeout=12000)
  page.wait_for_timeout(160)
  self.assertFalse(errors,'JavaScript errors: '+str(errors))
  return page,errors

 def test_desktop_open_world_has_no_mandatory_objective(self):
  page,errors=self.boot()
  self.assertEqual(page.title(),'SoLo — Esplorazione libera')
  self.assertEqual(page.locator('.brand strong').inner_text(),'SoLo')
  self.assertEqual(page.locator('#goal').count(),0)
  self.assertEqual(page.locator('#mini').count(),1)
  self.assertGreater(page.evaluate('window.__survivalStatus.animals'),10)
  self.assertTrue(page.evaluate('document.getElementById("game").width>0'))
  self.assertFalse(errors)

 def test_inventory_consumption_and_crafting_via_ui(self):
  state={**DEFAULT,'thirst':12,'inventory':{**DEFAULT['inventory'],'fiber':5}}
  page,_=self.boot(state)
  page.click('#bag-short');page.locator('button[data-act="consume"][data-id="water"]').click()
  self.assertGreater(page.evaluate('window.__survivalStatus.thirst'),40)
  page.click('#close');page.click('#craft-short')
  page.locator('button[data-act="craft"][data-id="rope"]').click()
  self.assertEqual(page.evaluate('window.__survivalStatus.inventory.rope'),1)
  self.assertEqual(page.evaluate('window.__survivalStatus.inventory.fiber'),1)

 def test_keyboard_movement_updates_direction_and_position(self):
  page,_=self.boot();initial=page.evaluate('window.__survivalStatus.x')
  page.keyboard.down('d');page.wait_for_timeout(400);page.keyboard.up('d')
  result=page.evaluate('window.__survivalStatus')
  self.assertGreater(result['x'],initial+15)
  self.assertAlmostEqual(result['face'],1.5707963267948966,delta=0.1)

 def test_touch_joystick_and_layout(self):
  page,_=self.boot(viewport=(390,844),touch=True)
  box=page.locator('#stick').bounding_box();self.assertIsNotNone(box)
  self.assertTrue(page.locator('#craft-short').is_visible())
  self.assertTrue(page.locator('#interact').is_visible())
  self.assertLess(page.evaluate('document.documentElement.scrollWidth'),405)
  page.locator('#bag-short').click();self.assertTrue(page.locator('#panel-content').is_visible());page.click('#close')

 def test_mobile_landscape(self):
  page,_=self.boot(viewport=(844,390),touch=True)
  self.assertTrue(page.locator('#stick').is_visible());self.assertTrue(page.locator('#attack').is_visible())
  page.locator('#help-short').click();self.assertIn('Controlli',page.locator('#panel-content').inner_text())

 def test_farming_and_persistence(self):
  state={**DEFAULT,'x':1540,'y':3735}
  page,_=self.boot(state)
  page.click('#interact');self.assertEqual(page.evaluate('window.__survivalStatus.plots'),1)
  saved=page.evaluate("JSON.parse(__store.get('solo-save-v1'))")
  self.assertEqual(saved['inventory']['seed'],3)
  # A save is loaded without needing a new game or resetting the player's position.
  page2,_=self.boot(saved)
  self.assertEqual(page2.evaluate('window.__survivalStatus.plots'),1)
  self.assertEqual(page2.evaluate('window.__survivalStatus.inventory.seed'),3)

 def test_death_respawn_can_exit_modal(self):
  state={**DEFAULT,'health':0,'hunger':0,'thirst':0}
  page,_=self.boot(state)
  self.assertTrue(page.locator('#overlay').is_visible())
  page.locator('button[data-act="respawn"]').click()
  self.assertFalse(page.locator('#overlay').is_visible())
  self.assertGreater(page.evaluate('window.__survivalStatus.health'),60)

 def test_looting_and_legacy_save_migration(self):
  state={**DEFAULT,'x':1220,'y':3520}
  page,_=self.boot(state,legacy=True)
  page.click('#interact')
  self.assertIsNotNone(page.evaluate("__store.get('solo-save-v1')"))
  self.assertTrue(page.evaluate("__store.has('ultimo-viandante-survival-v2')"))

 def test_map_waypoint_and_visibility(self):
  page,_=self.boot();page.click('#map-btn');self.assertTrue(page.locator('#bigmap').is_visible())
  page.locator('button[data-act="waypoint"][data-id="police"]').click()
  self.assertIsNotNone(page.evaluate("JSON.parse(__store.get('solo-save-v1')).marker"))
  page.locator('button[data-act="marker-clear"]').click()
  self.assertIsNone(page.evaluate("JSON.parse(__store.get('solo-save-v1')).marker"))

 def test_extended_region_stories_and_atlas(self):
  state={**DEFAULT,'x':11800,'y':1900}
  page,errors=self.boot(state)
  self.assertEqual(page.locator('#zone').inner_text(),'IL PORTO DELLA NEBBIA')
  page.click('#map-btn')
  self.assertTrue(page.locator('#bigmap').is_visible())
  self.assertGreaterEqual(page.locator('article.journal-card').count(),18)
  self.assertIn('Banchine, magazzini',page.locator('#panel-content').inner_text())
  page.locator('button[data-act="waypoint"][data-id="costa"]').click()
  saved=page.evaluate("JSON.parse(__store.get('solo-save-v1'))")
  self.assertEqual(saved['marker'],{'x':20600,'y':14200})
  self.assertFalse(errors)

 def test_dropped_objects_persist_and_can_be_picked_up_again(self):
  page,errors=self.boot()
  page.click('#bag-short')
  page.locator('button[data-act="drop"][data-id="berry"]').click()
  progress=page.evaluate('window.__survivalStatus')
  self.assertEqual(progress['inventory']['berry'],3)
  self.assertEqual(len(progress['ground']),1)
  self.assertEqual(progress['ground'][0]['item'],'berry')
  dropped=page.evaluate("JSON.parse(__store.get('solo-save-v1'))")
  self.assertEqual(len(dropped['ground']),1)
  self.assertFalse(errors)
  page2,errors2=self.boot(dropped)
  self.assertEqual(len(page2.evaluate('window.__survivalStatus.ground')),1)
  page2.wait_for_timeout(350)
  page2.click('#interact')
  collected=page2.evaluate('window.__survivalStatus')
  self.assertEqual(collected['inventory']['berry'],4)
  self.assertEqual(collected['ground'],[])
  self.assertFalse(errors2)

 def test_legacy_memories_are_removed_without_resetting_inventory(self):
  state={**DEFAULT,'found':[0,5,16],'inventory':{**DEFAULT['inventory'],'berry':12}}
  page,errors=self.boot(state)
  page.click('#map-btn')
  self.assertEqual(page.locator('#panel-content').get_by_text('TRACCE TROVATE').count(),0)
  saved=page.evaluate('window.__survivalStatus')
  self.assertEqual(saved['inventory']['berry'],12)
  self.assertFalse(errors)

 def test_distant_region_and_local_minimap(self):
  state={**DEFAULT,'x':16000,'y':12600}
  page,errors=self.boot(state,viewport=(390,844),touch=True)
  self.assertEqual(page.locator('#zone').inner_text(),'LA CASERMA MUTA')
  self.assertTrue(page.locator('#stick').is_visible())
  self.assertTrue(page.evaluate('document.getElementById("mini").width>0'))
  self.assertGreater(page.evaluate('window.__survivalStatus.x'),10000)
  self.assertFalse(errors)

if __name__=='__main__': unittest.main(verbosity=2)
