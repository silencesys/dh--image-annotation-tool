import style from './MenuBar.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/pro-solid-svg-icons'

const MenuBar = ({
  menuItems
}) => {
  const menu = menuItems.map((item, index) => {
    const subMenu = item?.items?.map((subItem, subIndex) => {
          if (typeof subItem.action === 'function') {
            return (<li className={style.SubMenuItem} key={subIndex}>
              <button className={style.ButtonSecondary} onClick={subItem.action}>
                {subItem.status && <FontAwesomeIcon icon={faCheck} className={style.ButtonSecondary__Icon} />}
                {subItem.name}
              </button>
            </li>)
          } else {
            return (<li className={style.SubMenuItemDividerWrapper} key={subIndex}>
             <hr className={style.SubMenuDivider} />
            </li>)
          }
    })
    return (
      <li className={style.MenuItem} key={index}>
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
