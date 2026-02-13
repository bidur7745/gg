import React, { useContext, useEffect } from 'react'
import Headers from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import { AppContext } from '../context/AppContext'

const Home = () => {
  const { getDoctorsData } = useContext(AppContext)
  useEffect(() => {
    getDoctorsData()
  }, [])
  return (
    <div>
      <Headers />
      <SpecialityMenu />
      <TopDoctors />
      <Banner />
    </div>
  )
}

export default Home
