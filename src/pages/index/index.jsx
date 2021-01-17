import React, { Component } from 'react'
import { View, Text } from '@tarojs/components'
import './index.less'
import WxParse from "../wxParse/wxParse";

export default class Index extends Component {

  componentWillMount () { }

  componentDidMount () { }

  componentWillUnmount () { }

  componentDidShow () { }

  componentDidHide () { }

  render () {
    let html = `<img src="https://res.wx.qq.com/wxdoc/dist/assets/img/0.4cb08bb4.jpg" /><img src="https://mmbiz.qpic.cn/mmbiz_png/1gmcynicwloGkVMTr6wTHdDXlFUSaSxOSRELianAFGJYVzvXJKoM2xbbFMqKe6ONy5zoHHejNbibTJn5gdEOc1aIA/0?wx_fmt=png" width="200" height="100" style="text-align: center;margin: 0 auto;"/>`
    return (
      <View className='index'>
        <WxParse nodes={html}></WxParse>
        <Text>Hello world!</Text>
      </View>
    )
  }
}
