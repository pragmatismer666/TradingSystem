var data = [];
if ( localStorage.getItem("user_type") === "0"){
  data = [
    {
      id: "home",
      icon: "",
      label: "menu.home",
      to: "/app/home",
      space: "mr-4"
      // subs: [
      //   {
      //     icon: "simple-icon-paper-plane",
      //     label: "menu.start",
      //     to: "/app/home/start"
      //   }     
      // ]
    },
    {
      id: "strategy",
      icon: "",
      label: "menu.strategy",
      to: "/app/strategy",
      space: "mr-4"
      // subs: [
      //   {
      //     icon: "simple-icon-paper-plane",
      //     label: "menu.second",
      //     to: "/app/second-menu/second"
      //   }
      // ]
    },
    {
      id: "manage",
      icon: "",
      label: "menu.manage",
      to: "/app/manage",
      space: "mr-4"
    }
    // ,
    // {
    //   id: "manage",
    //   icon: "iconsminds-bucket",
    //   label: "menu.manage",
    //   to: "/app/manage",
    //   space: "mr-4",
    //   subs: [
    //     {
    //       icon: "simple-icon-paper-plane",
    //       label: "menu.employees",
    //       to: "/app/manage/employees"
    //     },
    //     {
    //       icon: "simple-icon-paper-plane",
    //       label: "menu.client",
    //       to: "/app/manage/back"
    //     },
    //     {
    //       icon: "simple-icon-paper-plane",
    //       label: "menu.chemicals",
    //       to: "/app/manage/back"
    //     },
    //     {
    //       icon: "simple-icon-paper-plane",
    //       label: "menu.weeds",
    //       to: "/app/manage/back"
    //     },
    //     {
    //       icon: "simple-icon-paper-plane",
    //       label: "menu.web_users",
    //       to: "/app/manage/users"
    //     }
    //   ]
    // },
    // {
    //   id: "docs",
    //   icon: "iconsminds-library",
    //   label: "menu.docs",
    //   // to: "https://gogo-react-docs.coloredstrategies.com/",
    //   to : "http://139.59.163.57/register/",
    //   newWindow:true
    // }
  ];  
}
else {
  data = [
    {
      id: "home",
      icon: "",
      label: "menu.home",
      to: "/app/home",
      space: "mr-4"
    },
    {
      id: "manage",
      icon: "",
      label: "menu.manage",
      to: "/app/manage",
      space: "mr-4"
    }
  ];
}

export default data;