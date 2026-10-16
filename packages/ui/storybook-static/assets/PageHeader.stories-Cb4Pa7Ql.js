import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{B as l}from"./Button-Bta0QJ4H.js";import{B as v}from"./Badge-BqQevOsj.js";import{I as o}from"./Icons-BzMnhSjF.js";function p({title:f,description:t,action:n,breadcrumbs:s,badge:x,className:u=""}){return e.jsxs("header",{className:`flex flex-col gap-2 ${u}`,children:[s&&s.length>0&&e.jsx("nav",{"aria-label":"Migas de pan",className:"flex items-center gap-1.5 text-xs text-[var(--muted)]",children:s.map((a,i)=>{const g=i===s.length-1;return e.jsxs("span",{className:"inline-flex items-center gap-1.5",children:[i>0&&e.jsx("span",{className:"opacity-40",children:"/"}),a.onClick?e.jsx("button",{type:"button",onClick:a.onClick,className:"hover:text-[var(--foreground)] transition-colors underline-offset-4 hover:underline cursor-pointer",children:a.label}):a.href?e.jsx("a",{href:a.href,className:"hover:text-[var(--foreground)] transition-colors underline-offset-4 hover:underline",children:a.label}):e.jsx("span",{className:g?"font-medium text-[var(--foreground)]":"text-[var(--muted)]",children:a.label})]},a.label)})}),e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-4",children:[e.jsxs("div",{className:"flex flex-col gap-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-3 flex-wrap",children:[e.jsx("h1",{className:"font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]",children:f}),x]}),t&&e.jsx("p",{className:"text-xs sm:text-sm text-[var(--muted)] leading-relaxed max-w-2xl",children:t})]}),n&&e.jsx("div",{className:"flex items-center gap-2 self-start sm:self-auto shrink-0",children:n})]})]})}p.__docgenInfo={description:"",methods:[],displayName:"PageHeader",props:{title:{required:!0,tsType:{name:"string"},description:""},description:{required:!1,tsType:{name:"string"},description:""},action:{required:!1,tsType:{name:"ReactNode"},description:""},breadcrumbs:{required:!1,tsType:{name:"Array",elements:[{name:"BreadcrumbItem"}],raw:"BreadcrumbItem[]"},description:""},badge:{required:!1,tsType:{name:"ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:'""',computed:!1}}}};const b={title:"Layout/PageHeader",component:p,tags:["autodocs"],parameters:{layout:"padded"}},r={args:{title:"Servicios y Tratamientos",description:"Catálogo de procedimientos clínicos, tarifas y duraciones estimadas.",badge:e.jsx(v,{variant:"primary",children:"24 activos"}),breadcrumbs:[{label:"Clínica",href:"#"},{label:"Configuración",href:"#"},{label:"Servicios"}],action:e.jsxs("div",{className:"flex gap-2",children:[e.jsx(l,{variant:"outline",size:"sm",leftIcon:o.filter,children:"Exportar"}),e.jsx(l,{variant:"primary",size:"sm",leftIcon:o.plus,children:"Nuevo Servicio"})]})}};var c,d,m;r.parameters={...r.parameters,docs:{...(c=r.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    title: "Servicios y Tratamientos",
    description: "Catálogo de procedimientos clínicos, tarifas y duraciones estimadas.",
    badge: <Badge variant="primary">24 activos</Badge>,
    breadcrumbs: [{
      label: "Clínica",
      href: "#"
    }, {
      label: "Configuración",
      href: "#"
    }, {
      label: "Servicios"
    }],
    action: <div className="flex gap-2">\r
        <Button variant="outline" size="sm" leftIcon={Icons.filter}>\r
          Exportar\r
        </Button>\r
        <Button variant="primary" size="sm" leftIcon={Icons.plus}>\r
          Nuevo Servicio\r
        </Button>\r
      </div>
  }
}`,...(m=(d=r.parameters)==null?void 0:d.docs)==null?void 0:m.source}}};const B=["Default"];export{r as Default,B as __namedExportsOrder,b as default};
