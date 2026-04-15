# App.jsx — Firebase changes for Cursor

## 1. Replace the top two import lines

FIND:
```
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
```

REPLACE WITH:
```
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { auth, signInWithGoogle, signOutUser, loadUserData, saveUserData, loadUserProfile, createUserProfile } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
```

---

## 2. Replace the fake ACCOUNTS array (around line 2915)

FIND:
```
const ACCOUNTS=[
  {id:'a1',name:'Matthew Perrott',email:'matt@mightysound.studio',  password:'mighty2026',role:'admin',  avatar:'MP',color:'#5c6bc0'},
  {id:'a2',name:'Paul Reeves',    email:'paul@mightysound.studio',   password:'mighty2026',role:'staff',  avatar:'PR',color:'#d32f2f'},
  {id:'a3',name:'Kristen Settinelli',email:'kristen@mightysound.studio',password:'mighty2026',role:'staff',avatar:'KS',color:'#2e7d32'},
  {id:'a4',name:'David Chen',     email:'david@chenfoley.com.au',    password:'freelance1', role:'freelancer',avatar:'DC',color:'#8e24aa'},
  {id:'a5',name:'Emma Walsh',     email:'emma@walsh.com.au',         password:'freelance1', role:'freelancer',avatar:'EW',color:'#fb8c00'},
];
```

REPLACE WITH:
```
// Role assignments — add new users here by their Google email
const ROLE_MAP = {
  'matt@mightysound.studio':    'admin',
  'paul@mightysound.studio':    'staff',
  'kristen@mightysound.studio': 'staff',
};
const getRoleForEmail = (email) => ROLE_MAP[email?.toLowerCase()] || 'staff';
```

---

## 3. Replace the account useState and add Firebase auth logic
   (find the App() function opening, around the account useState line)

FIND:
```
  const [account,setAccount]=useState(ACCOUNTS[0]); // default admin
```

REPLACE WITH:
```
  const [account,setAccount]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);

  // Firebase auth state listener
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if(firebaseUser){
        // Load or create profile
        let profile = await loadUserProfile(firebaseUser.uid);
        if(!profile){
          profile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            avatar: firebaseUser.displayName?.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2) || '?',
            role: getRoleForEmail(firebaseUser.email),
            photoURL: firebaseUser.photoURL,
            createdAt: new Date().toISOString(),
          };
          await createUserProfile(firebaseUser.uid, profile);
        }
        setAccount({...profile, photoURL: firebaseUser.photoURL});
      } else {
        setAccount(null);
      }
      setAuthLoading(false);
    });
    return ()=>unsub();
  },[]);
```

---

## 4. Replace the localStorage load/save effects

FIND:
```
  useEffect(()=>{try{const r=localStorage.getItem('wb5_data');setData(r?JSON.parse(r):INIT)}catch{setData(INIT)}setLoaded(true)},[]);
  useEffect(()=>{if(!loaded||!data)return;clearTimeout(saveRef.current);saveRef.current=setTimeout(()=>{try{localStorage.setItem('wb5_data',JSON.stringify(data))}catch{}},700)},[data,loaded]);
```

REPLACE WITH:
```
  // Load data when user signs in
  useEffect(()=>{
    if(!account)return;
    (async()=>{
      try{
        const saved = await loadUserData(account.uid);
        setData(saved || INIT);
      } catch { setData(INIT); }
      setLoaded(true);
    })();
  },[account?.uid]);

  // Save data on change
  useEffect(()=>{
    if(!loaded||!data||!account)return;
    clearTimeout(saveRef.current);
    saveRef.current=setTimeout(async()=>{
      try{ await saveUserData(account.uid, data); }catch{}
    },700);
  },[data,loaded]);
```

---

## 5. Add sign-in gate and loading state
   Find the line just before the main App return (look for `if(!account)` or just before `return(`)

ADD before the main return:
```
  if(authLoading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#1a1a2e',color:'#fff',fontFamily:'Barlow,sans-serif',fontSize:14}}>
      Loading…
    </div>
  );

  if(!account) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#1a1a2e'}}>
      <div style={{textAlign:'center',fontFamily:'Barlow,sans-serif'}}>
        <div style={{fontSize:28,fontWeight:800,color:'#fff',marginBottom:4}}>Mighty Sound</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,.4)',fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:40}}>WorkBoard</div>
        <button onClick={signInWithGoogle} style={{display:'flex',alignItems:'center',gap:12,background:'#fff',border:'none',borderRadius:8,padding:'12px 24px',fontSize:14,fontWeight:700,cursor:'pointer',color:'#333',margin:'0 auto'}}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.34-8.16 2.34-6.26 0-11.57-3.59-13.46-8.83l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
```

---

## 6. Update the user display in the sidebar
   Find the user avatar/name display at the bottom of the sidebar

FIND:
```
<div className="user-av" style={{background:ACCOUNTS.find(a=>a.id===account.id)?.color||'#fff',color:'#fff',fontSize:10}}>{account.avatar}</div>
```

REPLACE WITH:
```
{account.photoURL
  ? <img src={account.photoURL} style={{width:28,height:28,borderRadius:'50%',objectFit:'cover'}} alt=""/>
  : <div className="user-av" style={{background:'#5c6bc0',color:'#fff',fontSize:10}}>{account.avatar}</div>
}
```

---

## 7. package.json — add firebase

Run in terminal:
```
npm install firebase
```

