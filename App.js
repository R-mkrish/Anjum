import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Animated, Easing, Platform, StatusBar, Linking,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

/* ---------------- palette ---------------- */
const C = {
  ink:'#1b2a2f', inkSoft:'#4a5d63', paper:'#f3efe6', card:'#fbf9f4', line:'#d9d2c4',
  sage:'#6b8f7a', sageDeep:'#3f5f50', clay:'#c47a5a', dusk:'#5a6a8c', warn:'#b5573f', calm:'#7fa8c9',
};

const TWORDS = ['Completely calm','Very relaxed','Relaxed','Settled','A little tense','Noticeable',
  'Building','Tense','Very tense','Near overwhelmed','Overwhelmed'];
const tColor = i => (i <= 3 ? C.sage : i <= 6 ? C.clay : C.warn);

const CRISIS_FLAGS = ['kill myself','suicide','end my life','want to die','no reason to live',
  'hurt myself','self harm','self-harm',"don't want to be here",'cant go on',"can't go on","end it all"];

/* helplines — India (swap for your region) */
const RESOURCES = [
  { name:'Tele-MANAS (India)', num:'14416', tel:'14416', desc:'Free national mental-health support, 24/7, many languages.' },
  { name:'iCall', num:'9152987821', tel:'9152987821', desc:'Counsellor support, Mon–Sat 8am–10pm.' },
  { name:'A person you trust', num:'', tel:'', desc:'A friend, family member, or doctor — reaching out is a strong thing to do.' },
];

/* ================================================================= */
export default function App() {
  const [screen, setScreen] = useState('notif');
  const [tension, setTension] = useState(5);

  const go = useCallback((s) => { setScreen(s); }, []);

  const reset = () => { setTension(5); setScreen('notif'); };

  return (
    <SafeAreaView style={st.fill}>
      <StatusBar barStyle="dark-content" backgroundColor={C.paper} />
      <View style={st.phone}>
        {screen === 'notif'   && <NotifScreen go={go} />}
        {screen === 'checkin' && <CheckinScreen tension={tension} setTension={setTension} go={go} />}
        {screen === 'breath'  && <BreathScreen go={go} />}
        {screen === 'ground'  && <GroundScreen go={go} />}
        {screen === 'reframe' && <ReframeScreen go={go} />}
        {screen === 'crisis'  && <CrisisScreen go={go} reset={reset} />}
        {screen === 'done'    && <DoneScreen reset={reset} />}
        <Text style={st.disclaimer}>Prototype · a wellbeing tool, not medical care or a diagnosis.</Text>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- 0 · NOTIFICATION ---------------- */
function NotifScreen({ go }) {
  return (
    <View style={[st.screen, st.center]}>
      <Text style={st.eyebrow}>A QUIET NUDGE</Text>
      <Text style={st.h2}>It's 11:30 PM</Text>
      <Text style={[st.soft, { textAlign:'center', marginTop:8, maxWidth:260 }]}>
        This is how the app would reach out — gently, never alarming.
      </Text>
      <TouchableOpacity style={st.notif} activeOpacity={0.85} onPress={() => go('checkin')}>
        <View style={st.notifApp}><View style={st.notifIc} /><Text style={st.notifAppTxt}>PAUSE</Text></View>
        <Text style={st.notifMsg}>Hey — things feel a little busy right now. Want to take a 60-second pause together?</Text>
      </TouchableOpacity>
      <Text style={st.frameLabel}>Tap the notification to begin</Text>
      <TouchableOpacity onPress={() => go('checkin')}><Text style={st.softBtn}>Or just start →</Text></TouchableOpacity>
    </View>
  );
}

/* ---------------- 1 · CHECK-IN ---------------- */
function CheckinScreen({ tension, setTension, go }) {
  // simple tap-segment "slider" (no extra deps): 11 segments 0..10
  const segs = Array.from({ length: 11 }, (_, k) => k);
  const triage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
    go('breath');
  };
  return (
    <ScrollView contentContainerStyle={[st.screen, st.center]} showsVerticalScrollIndicator={false}>
      <Text style={st.eyebrow}>STEP 1 · CHECK IN</Text>
      <Text style={[st.h2, { textAlign:'center' }]}>How tense does your body feel right now?</Text>
      <Text style={[st.tVal, { color: tColor(tension) }]}>{tension}</Text>
      <Text style={st.tWord}>{TWORDS[tension]}</Text>

      <View style={st.segRow}>
        {segs.map(k => (
          <TouchableOpacity key={k} onPress={() => { setTension(k); Haptics.selectionAsync().catch(()=>{}); }}
            style={[st.seg, { backgroundColor: k <= tension ? tColor(tension) : '#fff',
              borderColor: k <= tension ? tColor(tension) : C.line }]} />
        ))}
      </View>
      <View style={st.segEnds}><Text style={st.segEndTxt}>0 · calm</Text><Text style={st.segEndTxt}>10 · overwhelmed</Text></View>

      <Text style={[st.soft, { fontSize:14, marginTop:22 }]}>Or tap how you feel:</Text>
      <View style={st.emojiRow}>
        {[['😌',1],['🙂',4],['😟',7],['😰',10]].map(([e,v]) => (
          <TouchableOpacity key={v} style={st.emojiBtn} onPress={() => { setTension(v); Haptics.selectionAsync().catch(()=>{}); }}>
            <Text style={{ fontSize:30 }}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={st.btn} onPress={triage}><Text style={st.btnTxt}>Continue</Text></TouchableOpacity>
      <Dots active={0} />
    </ScrollView>
  );
}

/* ---------------- 2 · BREATHING ---------------- */
function BreathScreen({ go }) {
  const scale = useRef(new Animated.Value(0.62)).current;
  const [word, setWord] = useState('Get ready…');
  const [sub, setSub] = useState('Box breathing · 4-4-4-4');
  const [canNext, setCanNext] = useState(false);
  const phaseIdx = useRef(0);
  const cycles = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const phases = [
      { w:'Breathe in', to:1.25, dur:4000, h:Haptics.ImpactFeedbackStyle.Medium },
      { w:'Hold',       to:1.25, dur:4000, h:Haptics.ImpactFeedbackStyle.Light },
      { w:'Breathe out',to:0.62, dur:4000, h:Haptics.ImpactFeedbackStyle.Medium },
      { w:'Hold',       to:0.62, dur:4000, h:Haptics.ImpactFeedbackStyle.Light },
    ];
    const runPhase = () => {
      if (!mounted.current) return;
      const p = phases[phaseIdx.current];
      setWord(p.w); setSub(p.w);
      Haptics.impactAsync(p.h).catch(()=>{});
      Animated.timing(scale, { toValue:p.to, duration:p.dur, easing:Easing.inOut(Easing.ease), useNativeDriver:true })
        .start(() => {
          if (!mounted.current) return;
          phaseIdx.current = (phaseIdx.current + 1) % 4;
          if (phaseIdx.current === 0) {
            cycles.current += 1;
            if (cycles.current >= 2) { setCanNext(true); setSub('2 rounds done · keep going or continue'); }
          }
          runPhase();
        });
    };
    const t = setTimeout(runPhase, 600);
    return () => { mounted.current = false; clearTimeout(t); scale.stopAnimation(); };
  }, []);

  return (
    <View style={st.screen}>
      <Text style={[st.eyebrow, { textAlign:'center' }]}>STEP 2 · BREATHE</Text>
      <View style={st.breathStage}>
        <View style={st.orbArea}>
          <Animated.View style={[st.orbWrap, { transform:[{ scale }] }]}>
            <Svg width={140} height={140}>
              <Defs>
                <RadialGradient id="g" cx="35%" cy="30%" r="75%">
                  <Stop offset="0%" stopColor="#a7c9dd" />
                  <Stop offset="70%" stopColor={C.calm} />
                  <Stop offset="100%" stopColor="#5f8bab" />
                </RadialGradient>
              </Defs>
              <Circle cx={70} cy={70} r={68} fill="url(#g)" />
            </Svg>
          </Animated.View>
        </View>
        <Text style={st.breathWord}>{word}</Text>
        <Text style={st.breathSub}>{sub}</Text>
      </View>
      <TouchableOpacity style={[st.btn, !canNext && st.btnDim]} disabled={!canNext} onPress={() => go('ground')}>
        <Text style={st.btnTxt}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => go('ground')}><Text style={st.softBtn}>Skip ahead</Text></TouchableOpacity>
      <Dots active={1} />
    </View>
  );
}

/* ---------------- 3 · GROUNDING ---------------- */
const G_STEPS = [
  { n:3, prompt:'Tap each tile as you find one thing you can SEE around you.' },
  { n:3, prompt:'Now tap as you notice one thing you can HEAR.' },
  { n:3, prompt:'Finally, tap as you notice one thing you can FEEL (your feet, the chair, the phone).' },
];
function GroundScreen({ go }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState([]);
  const [finished, setFinished] = useState(false);

  const tap = (i) => {
    if (done.includes(i)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
    const nd = [...done, i];
    setDone(nd);
    if (nd.length >= G_STEPS[step].n) {
      setTimeout(() => {
        if (step < G_STEPS.length - 1) { setStep(step + 1); setDone([]); }
        else { setFinished(true); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{}); }
      }, 420);
    }
  };

  return (
    <View style={st.screen}>
      <Text style={[st.eyebrow, { textAlign:'center' }]}>STEP 3 · GROUND</Text>
      <Text style={[st.h2, { textAlign:'center', marginTop:6 }]}>Come back to the room</Text>
      <Text style={st.groundPrompt}>{finished ? "Nicely done. You're back in the room." : G_STEPS[step].prompt}</Text>
      <View style={st.groundGrid}>
        {Array.from({ length: G_STEPS[step].n }).map((_, i) => (
          <TouchableOpacity key={i} activeOpacity={0.8} onPress={() => tap(i)}
            style={[st.tile, done.includes(i) && st.tileDone]}>
            <Text style={[st.tileMark, done.includes(i) && st.tileMarkOn]}>✓</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[st.btn, !finished && st.btnDim]} disabled={!finished} onPress={() => go('reframe')}>
        <Text style={st.btnTxt}>Continue</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => go('reframe')}><Text style={st.softBtn}>Skip ahead</Text></TouchableOpacity>
      <Dots active={2} />
    </View>
  );
}

/* ---------------- 4 · REFRAMER ---------------- */
function ReframeScreen({ go }) {
  const [thought, setThought] = useState('');
  const [out, setOut] = useState(null);

  const doReframe = () => {
    const txt = thought.trim();
    if (txt.length < 3) return;
    const low = txt.toLowerCase();
    if (CRISIS_FLAGS.some(f => low.includes(f))) { go('crisis'); return; }
    const snippet = txt.length > 60 ? txt.slice(0, 60) + '…' : txt;
    setOut(snippet);
  };

  return (
    <ScrollView contentContainerStyle={st.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={st.eyebrow}>STEP 4 · REFRAME</Text>
      <Text style={st.h2}>What's the thought running through your mind?</Text>
      <Text style={[st.soft, { fontSize:14, marginVertical:10 }]}>
        Write it as it sounds in your head. We'll look at it from three angles.</Text>
      <TextInput value={thought} onChangeText={setThought} multiline textAlignVertical="top"
        placeholder="e.g. I always mess everything up and this will be a disaster…"
        placeholderTextColor="#a7a094" style={st.textarea} />
      <TouchableOpacity style={[st.btn, { marginTop:12 }]} onPress={doReframe}>
        <Text style={st.btnTxt}>Look at it differently</Text>
      </TouchableOpacity>

      {out && (
        <View style={{ width:'100%' }}>
          <Reframe kind="worst" label="Worst case"
            body={`The fear talking: "${out}" — this is the catastrophe your mind jumps to. It feels true, but it's one possibility, not a forecast.`} />
          <Reframe kind="best" label="Best case"
            body="It goes better than expected. The thing you're dreading eases, or you handle it more capably than the worry assumes." />
          <Reframe kind="real" label="Most realistic"
            body="Usually somewhere in between: not perfect, not a disaster. You deal with it one step at a time, and tomorrow it weighs less than it does at 11:30 PM tonight." />
          <TouchableOpacity style={[st.btn, st.ghost, { marginTop:14 }]} onPress={() => go('done')}>
            <Text style={[st.btnTxt, st.ghostTxt]}>I feel a bit steadier</Text>
          </TouchableOpacity>
        </View>
      )}
      <Dots active={3} />
    </ScrollView>
  );
}
function Reframe({ kind, label, body }) {
  const map = { worst:[C.warn, C.warn], best:[C.sage, C.sageDeep], real:[C.dusk, C.dusk] };
  const [border, lblColor] = map[kind];
  return (
    <View style={[st.reCard, { borderLeftColor:border, borderLeftWidth:3 }]}>
      <Text style={[st.reLbl, { color:lblColor }]}>{label.toUpperCase()}</Text>
      <Text style={st.reBody}>{body}</Text>
    </View>
  );
}

/* ---------------- CRISIS ---------------- */
function CrisisScreen({ go, reset }) {
  return (
    <ScrollView contentContainerStyle={st.screen} showsVerticalScrollIndicator={false}>
      <Text style={[st.eyebrow, { color:C.warn }]}>YOU'RE NOT ALONE</Text>
      <Text style={st.h2}>It sounds like things feel really heavy right now.</Text>
      <View style={st.crisisNote}>
        <Text style={st.crisisNoteTxt}>Whatever you're carrying, you don't have to carry it by yourself.
          Talking to someone can help — right now, if you need it.</Text>
      </View>
      {RESOURCES.map((r, i) => (
        <TouchableOpacity key={i} style={st.resource} activeOpacity={r.tel ? 0.7 : 1}
          onPress={() => r.tel && Linking.openURL(`tel:${r.tel}`)}>
          <Text style={st.resName}>{r.name}</Text>
          {!!r.num && <Text style={st.resNum}>{r.num}</Text>}
          <Text style={st.resDesc}>{r.desc}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[st.btn, { marginTop:18 }]} onPress={() => go('breath')}>
        <Text style={st.btnTxt}>Try a calming breath with me</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={reset}><Text style={st.softBtn}>Back to start</Text></TouchableOpacity>
    </ScrollView>
  );
}

/* ---------------- DONE ---------------- */
function DoneScreen({ reset }) {
  return (
    <View style={[st.screen, st.center]}>
      <Text style={{ fontSize:54, marginBottom:8 }}>🌿</Text>
      <Text style={[st.h2, { textAlign:'center' }]}>That's one small reset.</Text>
      <Text style={[st.soft, { textAlign:'center', marginTop:10, maxWidth:280 }]}>
        You paused, you breathed, you looked at the thought differently. That's enough for right now.</Text>
      <TouchableOpacity style={[st.btn, st.ghost, { marginTop:22 }]} onPress={reset}>
        <Text style={[st.btnTxt, st.ghostTxt]}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------- progress dots ---------------- */
function Dots({ active }) {
  return (
    <View style={st.dots}>
      {[0,1,2,3].map(i => <View key={i} style={[st.dot, i === active && st.dotOn]} />)}
    </View>
  );
}

/* ---------------- styles ---------------- */
const st = StyleSheet.create({
  fill:{ flex:1, backgroundColor:C.paper },
  phone:{ flex:1, maxWidth:460, width:'100%', alignSelf:'center', paddingHorizontal:22 },
  screen:{ flexGrow:1, paddingVertical:30, justifyContent:'flex-start' },
  center:{ justifyContent:'center', alignItems:'center' },

  eyebrow:{ fontSize:11, letterSpacing:1.5, color:C.sage, marginBottom:8, fontWeight:'700' },
  h2:{ fontSize:23, fontWeight:'700', color:C.ink, letterSpacing:-0.3, lineHeight:30 },
  soft:{ color:C.inkSoft },

  btn:{ backgroundColor:C.sageDeep, borderRadius:12, paddingVertical:15, alignItems:'center',
    width:'100%', marginTop:'auto' },
  btnDim:{ opacity:0.4 },
  btnTxt:{ color:'#fff', fontSize:16, fontWeight:'600' },
  ghost:{ backgroundColor:'transparent', borderWidth:1, borderColor:C.sageDeep },
  ghostTxt:{ color:C.sageDeep },
  softBtn:{ color:C.inkSoft, fontSize:14, paddingVertical:12, textAlign:'center', marginTop:4 },

  notif:{ backgroundColor:C.card, borderWidth:1, borderColor:C.line, borderRadius:18, padding:18,
    width:'100%', marginTop:18, shadowColor:'#1f2a2f', shadowOpacity:0.14, shadowRadius:18,
    shadowOffset:{ width:0, height:8 }, elevation:5 },
  notifApp:{ flexDirection:'row', alignItems:'center', gap:7, marginBottom:6 },
  notifIc:{ width:18, height:18, borderRadius:5, backgroundColor:C.sageDeep },
  notifAppTxt:{ fontSize:11, color:C.sage, letterSpacing:1, fontWeight:'700' },
  notifMsg:{ fontSize:16, color:C.ink, lineHeight:23 },
  frameLabel:{ fontSize:12, color:C.inkSoft, fontStyle:'italic', marginTop:14 },

  tVal:{ fontSize:64, fontWeight:'700', letterSpacing:-2, marginTop:14 },
  tWord:{ fontSize:15, color:C.inkSoft, minHeight:22 },
  segRow:{ flexDirection:'row', gap:5, width:'100%', marginTop:30 },
  seg:{ flex:1, height:18, borderRadius:6, borderWidth:1 },
  segEnds:{ flexDirection:'row', justifyContent:'space-between', width:'100%', marginTop:8 },
  segEndTxt:{ fontSize:12, color:C.inkSoft },
  emojiRow:{ flexDirection:'row', gap:8, width:'100%', marginVertical:18 },
  emojiBtn:{ flex:1, aspectRatio:1, backgroundColor:'#fff', borderWidth:1, borderColor:C.line,
    borderRadius:14, alignItems:'center', justifyContent:'center' },

  breathStage:{ flex:1, alignItems:'center', justifyContent:'center', width:'100%' },
  orbArea:{ width:260, height:260, alignItems:'center', justifyContent:'center', marginVertical:10 },
  orbWrap:{ width:140, height:140, alignItems:'center', justifyContent:'center' },
  breathWord:{ fontSize:24, fontWeight:'700', letterSpacing:0.5, color:C.dusk, marginTop:6, minHeight:34 },
  breathSub:{ fontSize:13, color:C.inkSoft, marginTop:4 },

  groundPrompt:{ fontSize:17, color:C.ink, textAlign:'center', marginTop:14, lineHeight:24, minHeight:50 },
  groundGrid:{ flexDirection:'row', flexWrap:'wrap', justifyContent:'center', gap:10, marginVertical:24 },
  tile:{ width:90, height:90, borderRadius:14, backgroundColor:C.card, borderWidth:1, borderColor:C.line,
    alignItems:'center', justifyContent:'center' },
  tileDone:{ backgroundColor:C.sage, borderColor:C.sage, transform:[{ scale:0.96 }] },
  tileMark:{ fontSize:24, color:'transparent' },
  tileMarkOn:{ color:'#fff' },

  textarea:{ width:'100%', backgroundColor:'#fff', borderWidth:1, borderColor:C.line, borderRadius:12,
    padding:14, fontSize:17, color:C.ink, minHeight:90, lineHeight:24 },
  reCard:{ backgroundColor:C.card, borderWidth:1, borderColor:C.line, borderRadius:14, padding:16, marginTop:12 },
  reLbl:{ fontSize:11, letterSpacing:1, fontWeight:'700', marginBottom:6 },
  reBody:{ fontSize:15, color:C.ink, lineHeight:22 },

  crisisNote:{ backgroundColor:'rgba(127,168,201,0.14)', borderRadius:12, padding:16, marginVertical:14 },
  crisisNoteTxt:{ fontSize:15, color:C.ink, lineHeight:22 },
  resource:{ backgroundColor:'#fff', borderWidth:1, borderColor:C.line, borderRadius:14, padding:16, marginTop:12 },
  resName:{ fontWeight:'700', fontSize:16, color:C.ink },
  resNum:{ fontSize:15, color:C.sageDeep, marginTop:2, fontWeight:'600' },
  resDesc:{ fontSize:13, color:C.inkSoft, marginTop:3, lineHeight:18 },

  dots:{ flexDirection:'row', gap:6, justifyContent:'center', marginTop:18 },
  dot:{ width:7, height:7, borderRadius:4, backgroundColor:C.line },
  dotOn:{ backgroundColor:C.sageDeep },
  disclaimer:{ fontSize:11, color:C.inkSoft, textAlign:'center', paddingVertical:12, lineHeight:16 },
});
