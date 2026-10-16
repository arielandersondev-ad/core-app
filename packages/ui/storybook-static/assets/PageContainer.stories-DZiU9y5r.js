import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{C as r}from"./Card-hHFJwj1q.js";function s({children:o,maxWidth:d="max-w-7xl",className:i=""}){return e.jsx("div",{className:`w-full ${d} mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 ${i}`,children:o})}s.__docgenInfo={description:"",methods:[],displayName:"PageContainer",props:{children:{required:!0,tsType:{name:"ReactNode"},description:""},maxWidth:{required:!1,tsType:{name:"union",raw:'"max-w-7xl" | "max-w-5xl" | "max-w-4xl" | "max-w-2xl" | string',elements:[{name:"literal",value:'"max-w-7xl"'},{name:"literal",value:'"max-w-5xl"'},{name:"literal",value:'"max-w-4xl"'},{name:"literal",value:'"max-w-2xl"'},{name:"string"}]},description:"",defaultValue:{value:'"max-w-7xl"',computed:!1}},className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:'""',computed:!1}}}};const p={title:"Layout/PageContainer",component:s,tags:["autodocs"],parameters:{layout:"fullscreen"}},a={render:()=>e.jsxs(s,{children:[e.jsxs("div",{className:"bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]",children:[e.jsx("h2",{className:"font-display font-bold text-xl text-[var(--foreground)]",children:"Contenido dentro de PageContainer"}),e.jsx("p",{className:"text-sm text-[var(--muted)] mt-1",children:"Este layout asegura márgenes responsivos unificados (p-4 en móvil, p-6 en tablet, p-8 en escritorio) y anchos máximos consistentes en toda la aplicación."})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-4",children:[e.jsx(r,{className:"p-4",children:"Columna 1"}),e.jsx(r,{className:"p-4",children:"Columna 2"}),e.jsx(r,{className:"p-4",children:"Columna 3"})]})]})};var n,t,l;a.parameters={...a.parameters,docs:{...(n=a.parameters)==null?void 0:n.docs,source:{originalSource:`{
  render: () => <PageContainer>\r
      <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">\r
        <h2 className="font-display font-bold text-xl text-[var(--foreground)]">\r
          Contenido dentro de PageContainer\r
        </h2>\r
        <p className="text-sm text-[var(--muted)] mt-1">\r
          Este layout asegura márgenes responsivos unificados (p-4 en móvil, p-6 en tablet, p-8 en escritorio) y anchos máximos consistentes en toda la aplicación.\r
        </p>\r
      </div>\r
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">\r
        <Card className="p-4">Columna 1</Card>\r
        <Card className="p-4">Columna 2</Card>\r
        <Card className="p-4">Columna 3</Card>\r
      </div>\r
    </PageContainer>
}`,...(l=(t=a.parameters)==null?void 0:t.docs)==null?void 0:l.source}}};const u=["Default"];export{a as Default,u as __namedExportsOrder,p as default};
