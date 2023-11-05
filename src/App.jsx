import { useMemo, useState } from 'react'

import { toast } from 'react-toastify'

import Chart from './chart'
import MyDatePicker from './datePicker'
import httpService from './http.service'
import './style.css'


const App = () => {
  const [nodes, setNodes] = useState([])
  const [newChart, setNewChart] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState([])
  const [indexResult, setIndexResult] = useState(0)
  const [search, setSearch] = useState('')

  const getCharts = () => {
    httpService.get('GetByParent')
      .then(res => setNodes(res.data))
      .catch(err => console.log(err))
  }

  useMemo(() => {
    getCharts()
  }, [])

  const closeHandle = () => {
    setTitle('')
    setDate('')
    setNewChart(false)
  }

  const saveNewHandle = e => {
    e.preventDefault()
    if (!date || !title) return

    const newObj = {
      name_Mc: title,
      startDate_Mc: date,
      code_Parent_Mc: 0
    }

    setLoading(true)
    httpService.post('Create', newObj)
      .then(res => {
        if (res.status === 200) {
          setNodes(prev => ([...prev, ...res.data]))
          closeHandle()
        }
      })
      .catch(err => {
        console.log(err)
      })
      .finally(() => setLoading(false))
  }

  const getSearchItmes = (data, propsNodes = []) => {
    if (!data[indexResult]) return

    if (propsNodes.filter(node => node.id === data[indexResult].id).length > 0) return

    setLoading(true)
    httpService.get('GetWithParents', { params: { code: data[indexResult].code_Mc } })
      .then(res => {
        const filterResponse = res.data?.filter(dataNode => !propsNodes.map(n => n.id).includes(dataNode.id))
        setNodes([...propsNodes, ...filterResponse])
      })
      .catch(err => {
        console.log(err)
        toast.error('مشکلی پیش آمده لطفا بعدا دوباره امتحان نمایید')
      })
      .finally(() => setLoading(false))
  }

  useMemo(() => {
    if (!result[indexResult]) return
    getSearchItmes(result, nodes)
  }, [indexResult])

  const searchHandle = e => {
    e.preventDefault()
    if (search.length <= 0) return

    setLoading(true)
    httpService.get('SearchNodes', { params: { search } })
      .then(res => {
        setResult(res.data)
        setIndexResult(0)
        setNodes([])
        getSearchItmes(res.data, [])
      })
      .catch(err => {
        console.log(err)
        toast.error('مشکلی پیش آمده لطفا بعدا دوباره امتحان نمایید')
      })
      .finally(() => setLoading(false))
  }

  const clearSearchHandle = () => {
    setNodes([])
    setSearch('')
    setResult([])
    getCharts()
  }

  const changeResultHandle = e => {
    const type = e.target.dataset.name
    if (type === 'add')
      result[indexResult + 1] && setIndexResult(prev => prev + 1)
    else
      result[indexResult - 1] && setIndexResult(prev => prev - 1)
  }

  return (
    <>
      <div className="content">
        <div className='header'>
          <form onSubmit={searchHandle}>
            <input name='search' type="text" placeholder='جستجو' value={search} onChange={e => setSearch(e.target.value)} />
            <div className='utils'>
              {result.length > 0 &&
                <span className='clear-btn' onClick={clearSearchHandle}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              }
              <button type='submit' disabled={loading} className='search-btn'>
                <span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </span>
              </button>
            </div>
            {result.length > 0 &&
              <div className='search_items'>
                <span
                  data-name="minus"
                  className={`plusIndex ${result[indexResult - 1] ? '' : 'disabled'}`}
                  onClick={changeResultHandle}
                >&uarr;</span>
                <span
                  data-name="add"
                  className={`minexIndex ${result[indexResult + 1] ? '' : 'disabled'}`}
                  onClick={changeResultHandle}
                >&darr;</span>
                <span className='counter'>{indexResult + 1} of {result.length}</span>
              </div>
            }
          </form>
          <button className='add-btn' onClick={() => setNewChart(true)}>
            <span className='icon'>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span>افزودن</span>
          </button>
        </div>
        <ul className={`tree ${result.length > 0 ? 'search' : ''}`}>

          {nodes.filter(chart => chart.code_Parent_Mc === 0).map(chart =>
            <Chart
              key={chart.id}
              data={chart}
              nodes={nodes}
              setNodes={setNodes}
              searchItem={result[indexResult]}
            />
          )}

          {newChart &&
            <li className='new'>
              <form className='new-chart' onSubmit={saveNewHandle}>
                <input placeholder='عنوان' type="text" value={title} onChange={e => setTitle(e.target.value)} />
                <MyDatePicker date={date} setDate={setDate} />
                <div className='action'>
                  <button disabled={loading} type='submit'>
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </button>
                  <button disabled={loading}>
                    <span onClick={closeHandle}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </button>
                </div>
              </form>
            </li>
          }
          {/* <li>
            <button className='add-btn' onClick={() => setNewChart(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </li> */}
        </ul>
      </div>
    </>
  )
}

export default App