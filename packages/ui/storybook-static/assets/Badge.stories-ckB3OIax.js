import{j as r}from"./jsx-runtime-D_zvdyIk.js";import{B as a}from"./Badge-BqQevOsj.js";const W={title:"UI/Badge",component:a,tags:["autodocs"],argTypes:{variant:{control:"select",options:["primary","success","warning","danger","neutral","active","inactive","suspended","role"]},size:{control:"radio",options:["sm","md"]},dot:{control:"boolean"}}},e={args:{children:"Administrador",variant:"primary",dot:!0}},n={args:{children:"Activo",variant:"success",dot:!0}},s={args:{children:"Pendiente",variant:"warning",dot:!0}},t={args:{children:"Cancelado",variant:"danger",dot:!0}},o={args:{children:"Borrador",variant:"neutral"}},i={render:()=>r.jsxs("div",{className:"flex items-center gap-3 flex-wrap",children:[r.jsx(a,{variant:"primary",dot:!0,children:"Primary"}),r.jsx(a,{variant:"success",dot:!0,children:"Success"}),r.jsx(a,{variant:"warning",dot:!0,children:"Warning"}),r.jsx(a,{variant:"danger",dot:!0,children:"Danger"}),r.jsx(a,{variant:"neutral",children:"Neutral"}),r.jsx(a,{variant:"role",children:"Role"})]})};var c,d,l;e.parameters={...e.parameters,docs:{...(c=e.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    children: "Administrador",
    variant: "primary",
    dot: true
  }
}`,...(l=(d=e.parameters)==null?void 0:d.docs)==null?void 0:l.source}}};var g,u,m;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    children: "Activo",
    variant: "success",
    dot: true
  }
}`,...(m=(u=n.parameters)==null?void 0:u.docs)==null?void 0:m.source}}};var p,v,h;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    children: "Pendiente",
    variant: "warning",
    dot: true
  }
}`,...(h=(v=s.parameters)==null?void 0:v.docs)==null?void 0:h.source}}};var B,x,y;t.parameters={...t.parameters,docs:{...(B=t.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    children: "Cancelado",
    variant: "danger",
    dot: true
  }
}`,...(y=(x=t.parameters)==null?void 0:x.docs)==null?void 0:y.source}}};var S,j,f;o.parameters={...o.parameters,docs:{...(S=o.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    children: "Borrador",
    variant: "neutral"
  }
}`,...(f=(j=o.parameters)==null?void 0:j.docs)==null?void 0:f.source}}};var w,A,N;i.parameters={...i.parameters,docs:{...(w=i.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-3 flex-wrap">\r
      <Badge variant="primary" dot>Primary</Badge>\r
      <Badge variant="success" dot>Success</Badge>\r
      <Badge variant="warning" dot>Warning</Badge>\r
      <Badge variant="danger" dot>Danger</Badge>\r
      <Badge variant="neutral">Neutral</Badge>\r
      <Badge variant="role">Role</Badge>\r
    </div>
}`,...(N=(A=i.parameters)==null?void 0:A.docs)==null?void 0:N.source}}};const R=["Primary","Success","Warning","Danger","Neutral","AllVariants"];export{i as AllVariants,t as Danger,o as Neutral,e as Primary,n as Success,s as Warning,R as __namedExportsOrder,W as default};
