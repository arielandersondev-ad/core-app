import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{I as c}from"./Input-C7PV2MIn.js";import{S as d}from"./Select-BkIOeMrL.js";import{B as m}from"./Button-Bta0QJ4H.js";import{I as r}from"./Icons-BzMnhSjF.js";import"./Label-DX0RjM55.js";function a({children:n,className:i=""}){return e.jsx("div",{className:`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-2xs ${i}`,children:n})}a.__docgenInfo={description:"",methods:[],displayName:"FilterToolbar",props:{children:{required:!0,tsType:{name:"ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:'""',computed:!1}}}};const I={title:"Layout/FilterToolbar",component:a,tags:["autodocs"],parameters:{layout:"padded"}},s={render:()=>e.jsxs(a,{className:"w-full max-w-4xl",children:[e.jsx("div",{className:"flex-1 min-w-[200px]",children:e.jsx(c,{inputSize:"sm",placeholder:"Buscar por nombre o cédula...",leftIcon:r.search})}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-40",children:e.jsx(d,{selectSize:"sm",options:[{value:"all",label:"Todos los estados"},{value:"active",label:"Activos"},{value:"inactive",label:"Inactivos"}]})}),e.jsx(m,{variant:"outline",size:"sm",leftIcon:r.filter,children:"Filtros"})]})]})};var l,t,o;s.parameters={...s.parameters,docs:{...(l=s.parameters)==null?void 0:l.docs,source:{originalSource:`{
  render: () => <FilterToolbar className="w-full max-w-4xl">\r
      <div className="flex-1 min-w-[200px]">\r
        <Input inputSize="sm" placeholder="Buscar por nombre o cédula..." leftIcon={Icons.search} />\r
      </div>\r
      <div className="flex items-center gap-2">\r
        <div className="w-40">\r
          <Select selectSize="sm" options={[{
          value: "all",
          label: "Todos los estados"
        }, {
          value: "active",
          label: "Activos"
        }, {
          value: "inactive",
          label: "Inactivos"
        }]} />\r
        </div>\r
        <Button variant="outline" size="sm" leftIcon={Icons.filter}>\r
          Filtros\r
        </Button>\r
      </div>\r
    </FilterToolbar>
}`,...(o=(t=s.parameters)==null?void 0:t.docs)==null?void 0:o.source}}};const h=["Default"];export{s as Default,h as __namedExportsOrder,I as default};
