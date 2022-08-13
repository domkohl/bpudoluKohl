import React from 'react'
import { Link } from "react-router-dom"
function Footer() {
  return (
    // <!-- Footer Start -->
    <footer className="bg-light text-center text-lg-start mt-auto">
      {/* <!-- Copyright --> */}
      <div className="text-center p-3" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
        ©2022 Copyright:
        <Link className="text-dark mx-1" to={"/"}>Dominik Kohl</Link>
      </div>
      {/* <!-- Footer End --> */}
    </footer>
  )
}
export default Footer