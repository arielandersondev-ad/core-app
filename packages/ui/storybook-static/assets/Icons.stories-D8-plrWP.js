import{j as r}from"./jsx-runtime-D_zvdyIk.js";import{I as c}from"./Icons-BzMnhSjF.js";const m={title:"UI/Icons",parameters:{layout:"padded"}},e={render:()=>{const s=Object.entries(c);return r.jsxs("div",{className:"w-full max-w-4xl",children:[r.jsxs("div",{className:"mb-6",children:[r.jsxs("h2",{className:"font-display text-xl font-bold text-[var(--foreground)]",children:["Catálogo Unificado de Iconos (",s.length," iconos)"]}),r.jsx("p",{className:"text-xs text-[var(--muted)] mt-1",children:"Iconos consistentes y optimizados compartidos por Core y Dentistry."})]}),r.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3",children:s.map(([t,i])=>r.jsxs("div",{className:"flex flex-col items-center justify-center p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] transition-all gap-2 group",children:[r.jsx("div",{className:"text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors flex items-center justify-center h-8",children:i}),r.jsx("span",{className:"text-[10px] font-mono text-[var(--muted)] text-center break-all select-all",children:t})]},t))})]})}};var o,n,a;e.parameters={...e.parameters,docs:{...(o=e.parameters)==null?void 0:o.docs,source:{originalSource:`{
  render: () => {
    const iconEntries = Object.entries(Icons);
    return <div className="w-full max-w-4xl">\r
        <div className="mb-6">\r
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">\r
            Catálogo Unificado de Iconos ({iconEntries.length} iconos)\r
          </h2>\r
          <p className="text-xs text-[var(--muted)] mt-1">\r
            Iconos consistentes y optimizados compartidos por Core y Dentistry.\r
          </p>\r
        </div>\r
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">\r
          {iconEntries.map(([name, icon]) => <div key={name} className="flex flex-col items-center justify-center p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] transition-all gap-2 group">\r
              <div className="text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors flex items-center justify-center h-8">\r
                {icon}\r
              </div>\r
              <span className="text-[10px] font-mono text-[var(--muted)] text-center break-all select-all">\r
                {name}\r
              </span>\r
            </div>)}\r
        </div>\r
      </div>;
  }
}`,...(a=(n=e.parameters)==null?void 0:n.docs)==null?void 0:a.source}}};const x=["AllIcons"];export{e as AllIcons,x as __namedExportsOrder,m as default};
