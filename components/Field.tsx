import { type ReactNode } from 'react'
import './Field.css'

export default function IconField({ name, value, icon: svg_icon, type = 'text', placeholder = '', onChange=(val) => {} }) {
  return (
    <div>
      <label>{name}</label>
      <div className="input-box">
        {svg_icon}
        <input
          value={value}
          type={type}
          placeholder={placeholder}
          className="input"
          onChange = {onChange}
        />
      </div>
    </div>
  )
}