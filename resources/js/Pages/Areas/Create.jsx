/**
 * Reconstructed source from TilkiAdisyon production bundle
 * Original entry: resources/js/Pages/Areas/Create.jsx
 * Bundle chunk: assets/Create-C_kz9cAi.js
 */
import{u as i,j as e,H as d,L as m}from"./app-tgt1EkC5.js";import{A as u}from"./AppLayout-ZHF-BB9p.js";import{I as c,B as p}from"./Select-BaLHhRWb.js";import{C as x}from"./Card-J4tzdytf.js";function b(){const{data:r,setData:s,post:t,processing:l,errors:n}=i({name:""}),o=a=>{a.preventDefault(),t(route("areas.store"))};return e.jsxs(u,{title:"Yeni Bölge",children:[e.jsx(d,{title:"Yeni Bölge"}),e.jsx("div",{className:"max-w-2xl mx-auto",children:e.jsx(x,{title:"Yeni Bölge Ekle",children:e.jsxs("form",{onSubmit:o,className:"space-y-5",children:[e.jsx(c,{label:"Bölge Adı",value:r.name,onChange:a=>s("name",a.target.value),error:n.name,placeholder:"Örn: Bahçe"}),e.jsxs("div",{className:"flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800",children:[e.jsx(m,{href:route("areas.index"),className:"btn-ghost",children:"İptal"}),e.jsx(p,{type:"submit",loading:l,children:"Kaydet"})]})]})})})]})}export{b as default};
