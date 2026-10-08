import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{I as l}from"./Input-C7PV2MIn.js";import{I as j}from"./Icons-BzMnhSjF.js";import"./Label-DX0RjM55.js";const v={title:"UI/Input",component:l,tags:["autodocs"],argTypes:{inputSize:{control:"radio",options:["sm","md","lg"]},disabled:{control:"boolean"}}},a={args:{label:"Correo electrónico",placeholder:"ejemplo@clinica.com",hint:"Usaremos este correo para enviar confirmaciones."}},r={args:{label:"Buscar paciente o tratamiento",placeholder:"Escribe un nombre o cédula...",leftIcon:j.search}},o={args:{label:"Contraseña",type:"password",defaultValue:"123",error:"La contraseña debe tener al menos 8 caracteres."}},s={args:{label:"Identificador asignado",defaultValue:"CLINIC-8941",disabled:!0}},n={render:()=>e.jsxs("div",{className:"flex flex-col gap-4 w-80",children:[e.jsx(l,{inputSize:"sm",label:"Tamaño Pequeño (sm)",placeholder:"Input sm"}),e.jsx(l,{inputSize:"md",label:"Tamaño Mediano (md)",placeholder:"Input md"}),e.jsx(l,{inputSize:"lg",label:"Tamaño Grande (lg)",placeholder:"Input lg"})]})};var t,c,i;a.parameters={...a.parameters,docs:{...(t=a.parameters)==null?void 0:t.docs,source:{originalSource:`{
  args: {
    label: "Correo electrónico",
    placeholder: "ejemplo@clinica.com",
    hint: "Usaremos este correo para enviar confirmaciones."
  }
}`,...(i=(c=a.parameters)==null?void 0:c.docs)==null?void 0:i.source}}};var d,p,m;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    label: "Buscar paciente o tratamiento",
    placeholder: "Escribe un nombre o cédula...",
    leftIcon: Icons.search
  }
}`,...(m=(p=r.parameters)==null?void 0:p.docs)==null?void 0:m.source}}};var u,b,g;o.parameters={...o.parameters,docs:{...(u=o.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    label: "Contraseña",
    type: "password",
    defaultValue: "123",
    error: "La contraseña debe tener al menos 8 caracteres."
  }
}`,...(g=(b=o.parameters)==null?void 0:b.docs)==null?void 0:g.source}}};var I,f,h;s.parameters={...s.parameters,docs:{...(I=s.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    label: "Identificador asignado",
    defaultValue: "CLINIC-8941",
    disabled: true
  }
}`,...(h=(f=s.parameters)==null?void 0:f.docs)==null?void 0:h.source}}};var S,x,z;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4 w-80">\r
      <Input inputSize="sm" label="Tamaño Pequeño (sm)" placeholder="Input sm" />\r
      <Input inputSize="md" label="Tamaño Mediano (md)" placeholder="Input md" />\r
      <Input inputSize="lg" label="Tamaño Grande (lg)" placeholder="Input lg" />\r
    </div>
}`,...(z=(x=n.parameters)==null?void 0:x.docs)==null?void 0:z.source}}};const w=["Default","WithLeftIcon","WithError","Disabled","AllSizes"];export{n as AllSizes,a as Default,s as Disabled,o as WithError,r as WithLeftIcon,w as __namedExportsOrder,v as default};
