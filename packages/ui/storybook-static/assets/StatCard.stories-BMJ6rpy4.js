import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{I as a}from"./Icons-BzMnhSjF.js";const P={default:{valueText:"text-[var(--foreground)]",activeBorder:"border-[var(--primary)] bg-[var(--primary-subtle)]/40",badgeBg:"text-[var(--muted)]"},success:{valueText:"text-emerald-600 dark:text-emerald-400",activeBorder:"border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",badgeBg:"text-emerald-600 dark:text-emerald-400"},warning:{valueText:"text-amber-600 dark:text-amber-400",activeBorder:"border-amber-500 bg-amber-50 dark:bg-amber-950/20",badgeBg:"text-amber-600 dark:text-amber-400"},danger:{valueText:"text-[var(--danger)] dark:text-red-400",activeBorder:"border-red-500 bg-red-50 dark:bg-red-950/20",badgeBg:"text-[var(--danger)] dark:text-red-400"},accent:{valueText:"text-[var(--primary)] dark:text-[var(--primary-accent)]",activeBorder:"border-[var(--primary)] bg-[var(--primary-subtle)]",badgeBg:"text-[var(--primary)]"}};function r({label:C,value:B,sublabel:d,variant:N="default",icon:u,onClick:s,active:$=!1,className:q=""}){const c=P[N],A=s?"button":"div";return e.jsxs(A,{type:s?"button":void 0,onClick:s,className:`p-4 rounded-[var(--radius)] border flex flex-col justify-between text-left transition-all ${$?`${c.activeBorder} ring-1 ring-[var(--primary)]/30 shadow-xs`:s?"border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary-subtle)]/20 cursor-pointer shadow-2xs active:scale-[0.99]":"border-[var(--border)] bg-[var(--surface)] shadow-2xs"} ${q}`,children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 w-full",children:[e.jsx("span",{className:"text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]",children:C}),u&&e.jsx("span",{className:`text-base sm:text-lg ${c.badgeBg}`,children:u})]}),e.jsxs("div",{className:"mt-2",children:[e.jsx("p",{className:`font-display font-bold text-2xl sm:text-3xl tracking-tight leading-none ${c.valueText}`,children:B}),d&&e.jsx("p",{className:"text-[11px] text-[var(--muted)] mt-1.5 line-clamp-1",children:d})]})]})}r.__docgenInfo={description:"",methods:[],displayName:"StatCard",props:{label:{required:!0,tsType:{name:"string"},description:""},value:{required:!0,tsType:{name:"union",raw:"string | number",elements:[{name:"string"},{name:"number"}]},description:""},sublabel:{required:!1,tsType:{name:"string"},description:""},variant:{required:!1,tsType:{name:"union",raw:'"default" | "success" | "warning" | "danger" | "accent"',elements:[{name:"literal",value:'"default"'},{name:"literal",value:'"success"'},{name:"literal",value:'"warning"'},{name:"literal",value:'"danger"'},{name:"literal",value:'"accent"'}]},description:"",defaultValue:{value:'"default"',computed:!1}},icon:{required:!1,tsType:{name:"ReactNode"},description:""},onClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},active:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:'""',computed:!1}}}};const V={title:"UI/StatCard",component:r,tags:["autodocs"],argTypes:{variant:{control:"select",options:["default","success","warning","danger","accent"]},active:{control:"boolean"}}},t={args:{label:"Pacientes Activos",value:"1,248",sublabel:"+12% vs mes anterior",icon:a.users}},n={args:{label:"Ingresos del Día",value:"$4,850",sublabel:"34 transacciones completadas",variant:"accent",icon:a.dollarSign}},l={args:{label:"Citas Pendientes",value:"18",sublabel:"Requieren confirmación hoy",variant:"warning",icon:a.clock}},o={args:{label:"Tratamientos Atrasados",value:"3",sublabel:"Atención prioritaria",variant:"danger",icon:a.alertTriangle}},i={render:()=>e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl",children:[e.jsx(r,{label:"Total Usuarios",value:"480",sublabel:"8 creados esta semana",icon:a.users}),e.jsx(r,{label:"Citas Confirmadas",value:"94",sublabel:"Para la jornada de hoy",variant:"success",icon:a.check}),e.jsx(r,{label:"Por Cobrar",value:"$1,200",sublabel:"Facturas con vencimiento",variant:"warning",icon:a.clock}),e.jsx(r,{label:"Ingresos Mes",value:"$18,450",sublabel:"Meta superada al 104%",variant:"accent",icon:a.dollarSign})]})};var m,b,g;t.parameters={...t.parameters,docs:{...(m=t.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    label: "Pacientes Activos",
    value: "1,248",
    sublabel: "+12% vs mes anterior",
    icon: Icons.users
  }
}`,...(g=(b=t.parameters)==null?void 0:b.docs)==null?void 0:g.source}}};var v,p,x;n.parameters={...n.parameters,docs:{...(v=n.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    label: "Ingresos del Día",
    value: "$4,850",
    sublabel: "34 transacciones completadas",
    variant: "accent",
    icon: Icons.dollarSign
  }
}`,...(x=(p=n.parameters)==null?void 0:p.docs)==null?void 0:x.source}}};var f,y,w;l.parameters={...l.parameters,docs:{...(f=l.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    label: "Citas Pendientes",
    value: "18",
    sublabel: "Requieren confirmación hoy",
    variant: "warning",
    icon: Icons.clock
  }
}`,...(w=(y=l.parameters)==null?void 0:y.docs)==null?void 0:w.source}}};var h,T,j;o.parameters={...o.parameters,docs:{...(h=o.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    label: "Tratamientos Atrasados",
    value: "3",
    sublabel: "Atención prioritaria",
    variant: "danger",
    icon: Icons.alertTriangle
  }
}`,...(j=(T=o.parameters)==null?void 0:T.docs)==null?void 0:j.source}}};var S,k,I;i.parameters={...i.parameters,docs:{...(S=i.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">\r
      <StatCard label="Total Usuarios" value="480" sublabel="8 creados esta semana" icon={Icons.users} />\r
      <StatCard label="Citas Confirmadas" value="94" sublabel="Para la jornada de hoy" variant="success" icon={Icons.check} />\r
      <StatCard label="Por Cobrar" value="$1,200" sublabel="Facturas con vencimiento" variant="warning" icon={Icons.clock} />\r
      <StatCard label="Ingresos Mes" value="$18,450" sublabel="Meta superada al 104%" variant="accent" icon={Icons.dollarSign} />\r
    </div>
}`,...(I=(k=i.parameters)==null?void 0:k.docs)==null?void 0:I.source}}};const M=["Default","Accent","Warning","Danger","AllVariantsRow"];export{n as Accent,i as AllVariantsRow,o as Danger,t as Default,l as Warning,M as __namedExportsOrder,V as default};
