import { useRef, useState } from 'react'
import style from './Tooltip.module.css'

const ToolTooltip = ({
  children,
  tool
}) => {
  const timeoutIdRef = useRef()
  const [tooltipVisibility, setTooltipVisibility] = useState(false)

  const showTooltip = () => {
    clearTimeout(timeoutIdRef.current)
    timeoutIdRef.current = setTimeout(() => {
      setTooltipVisibility(true)
    }, 800)
  }
  const hideTooltip = () => {
    clearTimeout(timeoutIdRef.current)
    setTooltipVisibility(false)
  }

  return (
    <div className={style.Tooltip} onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      {children}
      {tooltipVisibility && <div className={style.TooltipBody}>
        <img src={tool.img} alt={tool.alt || tool.name} />
        <div className={style.TooltipContent}>
          <h2>{tool.name}</h2>
          <p>{tool.description}</p>
        </div>
      </div>}
    </div>
  )
}

export default ToolTooltip