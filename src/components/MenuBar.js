import style from './MenuBar.module.css'

const MenuBar = () => {
  const menu = [{
      name: 'File',
      items: [{
        name: 'New',
        action: () => {}
      }, {
        name: 'Open...',
        action: () => {}
      }, {}, {
        name: 'Save...',
        action: () => {}
      }, {}, {
        name: 'Refresh',
        action: () => window.location.reload()
      }]
    }, {
      name: 'Window',
      items: [{
          name: 'Code Pane',
          action: () => {}
        }
      ]
    }, {
      name: 'Help',
      items: [{
        name: 'IMA Help...',
        action: () => {}
      },{
        name: 'What\'s New...',
        action: () => {}
      }, {}, {
        name: 'About IMA',
        action: () => {}
      }, {}, {
        name: 'Send feedback',
        action: () => {}
      }, {
        name: 'GitHub',
        action: () => {}
      }]
    }].map(item => {
    const subMenu = item?.items?.map(subItem => {
          if (typeof subItem.action === 'function') {
            return (<li className={style.SubMenuItem}>
              <button className={style.ButtonSecondary} onClick={subItem.action}>
                {subItem.name}
              </button>
            </li>)
          } else {
            return (<li className={style.SubMenuItemDividerWrapper}>
             <hr className={style.SubMenuDivider} />
            </li>)
          }
    })

    return (
      <li className={style.MenuItem}>
        <button className={style.Button} onClick={item.action}>
          {item.name}
        </button>
        {item.items && <ul className={style.SubMenu}>
        {subMenu}
        </ul>}
      </li>
    )
  })



  return (
    <ul className={style.MenuBar}>
      {menu}
    </ul>
  )
}

export default MenuBar
