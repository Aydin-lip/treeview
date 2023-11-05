import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { toast } from "react-toastify"

import useHover from "./hooks/useHover"
import useClickOutside from "./hooks/useClickOutside"
import MyDatePicker from "./datePicker"
import httpService from "./http.service"


const Chart = ({ data, nodes, setNodes, searchItem }) => {
  const [openDropdown, setOpenDropdown] = useState(false)
  const [open, setOpen] = useState(false)
  const [newChart, setNewChart] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [editChart, setEditChart] = useState(false)
  const [loading, setLoading] = useState(false)
  const [delChart, setDelChart] = useState(false)

  const [hoverRef, isHovering] = useHover();
  const dropdownRef = useRef()
  const refA = useRef()

  useClickOutside(dropdownRef, () => {
    setOpenDropdown(false)
  })

  const editChartHandle = () => {
    setTitle(data.name_Mc)
    setDate(data.startDate_Mc)
    setEditChart(true)
    setOpen(false)
  }

  const closeHandle = () => {
    setTitle('')
    setDate('')
    setNewChart(false)
    setEditChart(false)
    setOpenDropdown(false)
  }

  const openNewChart = () => {
    setOpenDropdown(false)
    setNewChart(true)
    setOpen(true)
  }

  const saveEditHandle = e => {
    e.preventDefault()
    if (!date || !title) return

    const editObj = {
      ...data,
      name_Mc: title,
      startDate_Mc: date,
    }

    setLoading(true)
    httpService.post('Edit', editObj)
      .then(res => {
        if (res.status === 200) {
          const filterNodesPrev = nodes.filter(nd => nd.id < data.id)
          const filterNodesNext = nodes.filter(nd => nd.id > data.id)
          setNodes([...filterNodesPrev, res.data, ...filterNodesNext])
          closeHandle()
        }
      })
      .catch(err => {
        console.log(err)
        toast.error('لطفا تمامی موارد را به درستی وارد کنید.')
      })
      .finally(() => setLoading(false))
  }

  const saveNewHandle = e => {
    e.preventDefault()
    if (!date || !title) return

    const newObj = {
      name_Mc: title,
      startDate_Mc: date,
      code_Parent_Mc: data.id
    }
    const changeParent = {
      ...data,
      hasChildren: true
    }

    setLoading(true)
    httpService.post('Create', newObj)
      .then(res => {
        if (res.status === 200) {
          const filterNodesPrev = nodes.filter(nd => nd.id < data.id)
          const filterNodesNext = nodes.filter(nd => nd.id > data.id)
          setNodes([...filterNodesPrev, changeParent, ...filterNodesNext, res.data])
          closeHandle()
        }
      })
      .catch(err => {
        console.log(err)
      })
      .finally(() => setLoading(false))
  }

  const unDeleteHandle = id => {
    httpService.post('unDelete', {}, { params: { id } })
      .then(res => {

        const filterChart = nodes.filter(ch => ch.id !== data.id),
          filterParent = filterChart.find(nd => nd.id === data.code_Parent_Mc),
          filterNodesPrev = filterChart.filter(nd => nd.id < data.code_Parent_Mc),
          filterNodesNext = filterChart.filter(nd => nd.id > data.code_Parent_Mc)
        setNodes([...filterNodesPrev, { ...filterParent, hasChildren: true }, ...filterNodesNext, data])

      })
      .catch(err => console.log(err))
  }

  const setDeleteDataHandle = () => {
    const filterChart = nodes.filter(ch => ch.id !== data.id)
    if (filterChart.find(nd => nd.code_Parent_Mc === data.code_Parent_Mc))
      return setNodes(filterChart)

    const filterParent = filterChart.find(nd => nd.id === data.code_Parent_Mc),
      filterNodesPrev = filterChart.filter(nd => nd.id < data.code_Parent_Mc),
      filterNodesNext = filterChart.filter(nd => nd.id > data.code_Parent_Mc)
    setNodes([...filterNodesPrev, { ...filterParent, hasChildren: false }, ...filterNodesNext])
  }

  const deleteChartHandle = () => {
    setLoading(true)
    const prevv = toast.loading("لطفا منتظر بمانید...")
    httpService.delete(`${data.id}`)
      .then(res => {
        if (res.status === 200) {
          setDelChart(true)
          setOpenDropdown(false)
          toast.update(prevv, { render: <span>با موفقیت حذف شد. <a className="undelete" onClick={() => unDeleteHandle(data.id)}>انصراف</a></span>, type: "success", isLoading: false, autoClose: 5000, closeOnClick: true })

          setTimeout(() => {
            setDeleteDataHandle()
          }, 500);
        }
      })
      .catch(err => {
        console.log(err)
        toast.update(prevv, { render: err.response.data.error, type: "error", isLoading: false, autoClose: 5000, closeOnClick: true })
      })
      .finally(() => setLoading(false))
  }

  const openDropdownHandle = () => {
    setTimeout(() => {
      if (!openDropdown)
        setOpenDropdown(true)
    }, 100);
  }

  const getCharts = useCallback(() => {
    if (nodes.find(chart => chart.code_Parent_Mc === data.id)) return

    setLoading(true)
    httpService.get('GetByParent', { params: { parentCode: data.id } })
      .then(res => {
        setNodes([...nodes, ...res.data])
      })
      .catch(err => console.log(err))
      .finally(() => setLoading(false))

  }, [nodes])


  useEffect(() => {
    if (data.hasChildren && !searchItem)
      getCharts()
  }, [open])

  const findSearchItemHandle = (items) => {
    let find = false
    items?.forEach(item => {
      const childs = nodes.filter(n => n.code_Parent_Mc === item.id)
      const finded = childs.find(n => n.id === searchItem.id)
      if (finded)
        find = true
      if (!finded && childs.length > 0)
        if (findSearchItemHandle(childs))
          find = true
    })
    return find
  }

  useEffect(() => {
    // if (nodes.find(p => p.id === searchItem?.id && p.name_Mc.inclouds(searchItem.name_Mc)))
    if (searchItem) {
      const childs = nodes.filter(n => n.code_Parent_Mc === data.id)
      let finded = childs.find(n => n.id === searchItem.id)
      if (!finded && childs.length > 0)
        finded = findSearchItemHandle(childs)

      // if (finded) setOpen(true)
      // console.log(finded)

      // if (nodes.find(p => p.id === searchItem?.id))  
      if (finded)
        setOpen(true)
      else
        setOpen(false)
    }
  }, [searchItem, nodes])

  useMemo(() => {
    if (searchItem?.id === data.id) {
      setTimeout(() => {
        const activeHeight = refA.current.getBoundingClientRect();
        const winHeight = window.innerHeight
        window.scrollTo(0, activeHeight?.y - (winHeight - 100))
      }, 100);
    }
  }, [searchItem])

  return (
    <>
      <li className={delChart ? '' : 'openChart'}>
        <div ref={hoverRef} className="content">

          {data.hasChildren &&
            <button className={`arrow-btn ${open ? 'open' : 'close'}`} onClick={() => setOpen(prev => !prev)} disabled={loading}>
            </button>
          }

          {editChart ?
            <form className='new-chart' onSubmit={saveEditHandle}>
              <input
                placeholder="عنوان"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <MyDatePicker date={date} setDate={setDate} />
              <div className='action'>
                <button disabled={loading} type="submit">
                  <span >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </button>
                <button disabled={loading} onClick={closeHandle}>
                  <span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </button>
              </div>
            </form>
            :
            <a className={`${delChart ? 'delChart' : ''} ${searchItem?.id === data.id ? 'search-active' : ''}`} ref={refA}>{data.name_Mc}</a>
          }


          {(isHovering || openDropdown) && !editChart &&
            <div className="more-action">
              <svg onClick={openDropdownHandle} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>

              {openDropdown &&
                <div className="dropdown" ref={dropdownRef}>
                  <div className='items'>
                    <div className='add' onClick={openNewChart}>
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <span>افزودن</span>
                    </div>
                    <div className='edit' onClick={editChartHandle}>
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </span>
                      <span>ویرایش</span>
                    </div>
                    <div className='delete' onClick={deleteChartHandle}>
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </span>
                      <span>حذف</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        {open &&
          <ul>
            {nodes.filter(chart => chart.code_Parent_Mc === data.id).map(chart =>
              <Chart
                key={chart.id}
                data={chart}
                nodes={nodes}
                setNodes={setNodes}
                searchItem={searchItem}
                // openChart={
                //   nodes.filter(chart => chart.code_Parent_Mc === data.id).find(p => p.id === searchItem?.id) ? true : false
                // }
              />
            )}
            {newChart &&
              <li className='new'>
                <form className='new-chart' onSubmit={saveNewHandle}>
                  <input
                    placeholder="عنوان"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                  <MyDatePicker date={date} setDate={setDate} />
                  <div className='action'>
                    <button disabled={loading} type="submit">
                      <span >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    </button>
                    <button disabled={loading} onClick={closeHandle}>
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </form>
              </li>
            }
          </ul>
        }

      </li>
    </>
  )
}

export default Chart