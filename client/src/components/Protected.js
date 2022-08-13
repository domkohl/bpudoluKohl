import { useEffect, useState } from 'react'
import { useHistory } from "react-router-dom"
import axios from "axios"
import Cookies from 'universal-cookie';
import Navbar from "../components/Navbar";
// Pohled pres ktery jdou nektere cesty pro autorizaci
function Protected(props) {
    const history = useHistory()
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        setLoading(true)
        let authoriseNeeded = true
        if (props.authoriseNeeded === "false") {
            authoriseNeeded = false
        }
        //potrebujeme ke vstupu autorizaci(pristup maji jen autorizovani)
        const authorise = async () => {
            if (authoriseNeeded) {
                const cookies = new Cookies();
                if (!cookies.get('name')) {
                    setLoading(false)
                    return history.push(props.redirect)
                }
                let isAuth = false
                try {
                    const result = (await axios.get("/api/users/isAuth")).data
                    isAuth = result.isAuth
                } catch (error) {
                    console.log(error)
                }
                if (!isAuth) {
                    setLoading(false)
                    return history.push(props.redirect)
                } else {
                    setLoading(false)
                }
            } else {
                const cookies = new Cookies();
                if (cookies.get('name')) {
                    setLoading(false)
                    return history.push(props.redirect)
                }
                setLoading(false)
            }
        }
        authorise()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    let Component = props.ComponentCustom
    //musel jsem si predat parametry pres protect router do custom routeru a precetl jsem si objekt props v Protected routeru
    return (
        <>
            {loading ?
                <><Navbar />
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div></> : <Component params={props.computedMatch.params} />}
        </>
    )
}
export default Protected
