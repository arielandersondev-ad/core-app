import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{C as r}from"./Card-hHFJwj1q.js";import{B as s}from"./Button-Bta0QJ4H.js";const u={title:"UI/Card",component:r,tags:["autodocs"]},a={render:()=>e.jsxs(r,{className:"p-6 max-w-md",children:[e.jsx("h3",{className:"font-display font-bold text-lg text-[var(--foreground)] mb-2",children:"Título de la tarjeta"}),e.jsx("p",{className:"text-sm text-[var(--muted)] leading-relaxed mb-4",children:"Contenedor con superficie, bordes y radio estrictamente estandarizados para todo el proyecto."}),e.jsxs("div",{className:"flex justify-end gap-2",children:[e.jsx(s,{variant:"outline",size:"sm",children:"Cerrar"}),e.jsx(s,{variant:"primary",size:"sm",children:"Aceptar"})]})]})},t={render:()=>e.jsxs(r,{onClick:()=>alert("Tarjeta clickeada"),className:"p-5 max-w-sm",children:[e.jsx("p",{className:"text-xs font-mono uppercase tracking-wider text-[var(--muted)]",children:"Interactivo"}),e.jsx("h4",{className:"font-display font-semibold text-base text-[var(--foreground)] mt-1",children:"Haz clic en esta tarjeta"}),e.jsx("p",{className:"text-xs text-[var(--muted)] mt-1",children:"Soporta hover, active scale y estilos de focus."})]})};var o,n,d;a.parameters={...a.parameters,docs:{...(o=a.parameters)==null?void 0:o.docs,source:{originalSource:`{
  render: () => <Card className="p-6 max-w-md">\r
      <h3 className="font-display font-bold text-lg text-[var(--foreground)] mb-2">\r
        Título de la tarjeta\r
      </h3>\r
      <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">\r
        Contenedor con superficie, bordes y radio estrictamente estandarizados para todo el proyecto.\r
      </p>\r
      <div className="flex justify-end gap-2">\r
        <Button variant="outline" size="sm">Cerrar</Button>\r
        <Button variant="primary" size="sm">Aceptar</Button>\r
      </div>\r
    </Card>
}`,...(d=(n=a.parameters)==null?void 0:n.docs)==null?void 0:d.source}}};var c,i,m;t.parameters={...t.parameters,docs:{...(c=t.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: () => <Card onClick={() => alert("Tarjeta clickeada")} className="p-5 max-w-sm">\r
      <p className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">Interactivo</p>\r
      <h4 className="font-display font-semibold text-base text-[var(--foreground)] mt-1">Haz clic en esta tarjeta</h4>\r
      <p className="text-xs text-[var(--muted)] mt-1">Soporta hover, active scale y estilos de focus.</p>\r
    </Card>
}`,...(m=(i=t.parameters)==null?void 0:i.docs)==null?void 0:m.source}}};const f=["Default","Interactive"];export{a as Default,t as Interactive,f as __namedExportsOrder,u as default};
