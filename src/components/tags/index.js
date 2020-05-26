import React from "react"

export const H2 = ({ children }) => {
  const props = {
    id: children.toLowerCase().replace(" ", "-"),
  }

  return (
    <>
      <a href={`#${props.id}`}>$</a>
      <h2 {...props}>{children}</h2>
    </>
  )
}
