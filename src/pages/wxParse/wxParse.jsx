import React, {Component} from 'react';
import { View,Block,Image,Button,Video,Text } from '@tarojs/components'
import HtmlToJson from './utils/html2json';
import showdown from './utils/showdown.js';
import { getSystemInfo, cacheInstance } from './utils/util';
import './wxParse.wxss'

let classNames = require('classnames')

const BIND_NAME = 'wxParse'
class WxParse extends Component {
  pageNodeKey = ''
  componentDidMount() {
    let {language,nodes} = this.props
    if (nodes) {
      this._parseNodes(nodes)
    }
  }

  componentWillUnmount() {
    // 组件销毁，清除绑定实例
    cacheInstance.remove(this.pageNodeKey)
  }
  _parseNodes = (nodes) => {
    // 设置页面唯一键值标识符
    const allPages = getCurrentPages()
    const currentPage = allPages[allPages.length - 1]
    this.pageNodeKey = `${BIND_NAME}_${currentPage.__wxExparserNodeId__}`

    if (typeof nodes === 'string') { // 初始为html富文本字符串
      this._parseHtml(nodes)
    } else if (Array.isArray(nodes)) { // html 富文本解析成节点数组
      this.setState({ nodesData: nodes })
    } else { // 其余为单个节点对象
      const nodesData = [ nodes ]
      this.setState({ nodesData })
    }
  }
  _parseHtml=(html)=> {
    //存放html节点转化后的json数据
    const transData = HtmlToJson.html2json(html, this.pageNodeKey)

    transData.view = {}
    transData.view.imagePadding = 0
    this.setState({
      nodesData: transData.nodes,
      bindData: {
        [this.pageNodeKey]: transData
      }
    })
    cacheInstance.set(this.pageNodeKey, transData)
  }
  /**
   * 图片视觉宽高计算函数区
   * @param {*} e
   */
  wxParseImgLoad=(e,tagFrom,index)=> {
    // 获取当前的image node节点
    // const { from: tagFrom, index } = e.target.dataset || {}
    // console.log (e.target.dataset)
    if (typeof tagFrom !== 'undefined' && tagFrom.length > 0) {
      const { width, height } = e.detail
      //因为无法获取view宽度 需要自定义padding进行计算，稍后处理
      const recal = this._wxAutoImageCal(width, height)
      let newArray =this.state.nodesData
      newArray[index].loaded =true
      console.log ()
      this.setState({
        width: recal.imageWidth,
        height: recal.imageHeight,
        nodesData: newArray
      })
    }
  }
  /**
   * 预览图片
   * @param {*} e
   */
  wxParseImgTap = (e) =>{
    const { src } = e.target.dataset
    const { imageUrls = [] } = cacheInstance.get(this.pageNodeKey)
    wx.previewImage({
      current: src,
      urls: imageUrls
    })
  }
  /**
   * 计算视觉优先的图片宽高
   * @param {*} originalWidth
   * @param {*} originalHeight
   */
  _wxAutoImageCal=(originalWidth, originalHeight) =>{
    let autoWidth = 0, autoHeight = 0;
    const results = {}
    const [ windowWidth, windowHeight ] = getSystemInfo()

    // 判断按照哪种方式进行缩放
    if (originalWidth > windowWidth) { //在图片width大于手机屏幕width时候
      autoWidth = windowWidth
      autoHeight = (autoWidth * originalHeight) / originalWidth
      results.imageWidth = autoWidth
      results.imageHeight = autoHeight
    } else { // 否则展示原来数据
      results.imageWidth = originalWidth
      results.imageHeight = originalHeight
    }
    return results
  }
  /**
   * 增加a标签跳转
   * 1. 如果page页面有handleTagATap事件，优先采用事件回调的方式处理
   * 2. 如果page页面没有handleTagATap事件，根据链接字段判断采用内外链跳转方式
   * @param {*} e
   */
  wxParseTagATap=(e)=> {
    const { src = '' } = e.currentTarget.dataset

    // 采用递归组件方式渲染，不能通过triggerEvent方式向父级传参，可以获取当前页面调用页面方法处理
    const curPages =  Taro.getCurrentPages();
    const currentPage = curPages[curPages.length - 1]
    if (currentPage && currentPage.handleTagATap) {
      currentPage.handleTagATap(src)
      return
    }

    // 判断是否内部链接跳转
    const isInnerPage = src.indexOf('http') === -1
    if (isInnerPage) {
      wx.navigateTo({
        url: src
      })
    } else {
      wx.navigateTo({
        url: `/components/wxParse/webviewPage/webviewPage?src=${src}`
      })
    }
  }
  state = {
    nodesData :[],
    bindData: {},
    width:0,
    height:0
  }
  render() {
    let {nodesData,width,height} = this.state
    return (
      <Block>
        {nodesData.map((item,index) => {
          return  <Block>
            {/* !--判断是否为标签节点-- */}
            {item.node == 'element' &&   <Block>
              {/*<!-- button类型 -->*/}
              {item.tag == 'button' &&   <Block>
                <Button type='default' size='mini'>
                  {/*<!-- 如果还有子节点，递归遍历自身 -->*/}
                  {item.nodes.map((child,index) => {
                    return   <Block>
                      <WxParse nodes={child} />
                    </Block>
                  })}
                </Button>
              </Block>}


              {/*<!-- code类型 -->*/}
              {/*item && item.tag === 'code' && <Block>
                <View className={item.classStr} style={item.styleStr}>
                  <highLight codeText='{{item.content}}' language='{{item.attr && item.attr.lang}}' />
                </View>
              </Block>*/}


              {/*<!-- ol类型 -->*/}
              {item.tag === 'ol' && <Block>
                <View className={classNames(`${item.classStr}`, 'wxParse-ol', 'mb10')} style={item.styleStr}>
                  {item.nodes.map((child,index) => {
                    return   <Block>
                      <View className='wxParse-ol-inner'>
                        <View className='wxParse-ol-number'>{index +1}.</View>
                        <View className={classNames('flex-full' ,'overflow-hide')}>
                         <WxParse nodes={child} />
                        </View>
                      </View>
                    </Block>
                  })}

                </View>
              </Block>}


              {/*<!-- ul类型 -->*/}
              {item.tag === 'ul' &&  <Block>
                <View className={classNames(`${item.classStr}`, 'wxParse-ul', 'mb10')} style={item.style.Str}>
                  {item.nodes.map((child,index) => {
                    return <Block>
                      <View className='wxParse-ul-inner'>
                        <View className='wxParse-li-circle' />
                        <View className='flex-full overflow-hide'>
                         <WxParse nodes={child} />
                        </View>
                      </View>
                    </Block>
                  })}

                </View>
              </Block>}


              {/*<!-- li类型 -->*/}
              {item.tag == 'li' &&  <Block>
                <View className={classNames(`${item.classStr}`, 'wxParse-li')} style={item.styleStr}>
                  {item.nodes.map((child,index) => {
                    return  <Block>
                      <WxParse nodes={child} />
                    </Block>
                  })}

                </View>
              </Block>}


              {/*<!-- video类型 -->*/}
              {item.tag === 'video' &&  <Block>
                {/*<!--增加video标签支持，并循环添加-->*/}
                <View className={classNames(`${item.classStr}`, `wxParse-${item.tag}`)} style={item.styleStr}>
                  <Video className={classNames (`${item.classStr}`, `wxParse-${item.tag}-video`)} src={item.attr.src} />
                </View>
              </Block>}


              {/*<!-- img类型 -->*/}
              {item.tag === 'img' && <Block>

                {item.attr.src &&  <View className='wxParse-img-inner'>

                  <Image
                    style={{display: 'none'}}
                    mode='widthFix'
                    data-from={item.from}
                    data-index={index}
                    src={item.attr.src}
                    onLoad={(e)=>this.wxParseImgLoad(e,item.from,index)}
                  />
                  <Image
                    className={classNames(`${item.classStr}`, `wxParse-${item.tag}`, `${item.loaded ? 'wxParse-img-fadein' : ''}`)}
                    data-from={item.from}
                    data-src={item.attr.src}
                    data-idx={item.imgIndex}
                    lazyLoad={false}
                    src={item.loaded?item.attr.src:''}
                    onClick={this.wxParseImgTap}
                    mode='widthFix'
                    style={{width:`${item.attr.width || width}px;height:${item.attr.height || height}px; ${item.styleStr}`}}
                  />
                  {!item.loaded && <Image className='img-loading' src={require('./images/loading.png')} />}
                </View>}
              </Block>}


              {/*<!-- a类型 -->*/}
              {item.tag === 'a' &&  <Block>
                <View onClick={this.wxParseTagATap} className={classNames('wxParse-inline', `${item.classStr}` ,`wxParse-${item.tag}`)}
                  data-title={item.attr.title} data-src={item.attr.href} style={item.styleStr}
                >
                  {item.nodes.map((child,index) => {
                    return <Block>
                      <WxParse nodes={child} />
                    </Block>
                  })}

                </View>
              </Block>}


              {/*<!-- table类型 -->*/}
              {item.tag === 'table' && <Block>
                <View className={classNames(`${item.classStr}`, `wxParse-${item.tag}`)}>
                  {item.nodes.map((child,index) => {
                    return <Block>
                      <WxParse nodes={child} />
                    </Block>
                  })}

                </View>
              </Block>}


              {/*<!-- tr 类型 -->*/}
              {item.tag === 'tr' &&   <Block>
                <View className={classNames(`${item.classStr}`, `wxParse-${item.tag}`)}>
                  {item.nodes.map((child,index) => {
                    return  <Block>
                      <View  className={classNames(`${child.classStr}`, `wxParse-${child.tag}`, `wxParse-${child.tag}-container`)} style={child.styleStr}>
                        <WxParse nodes={child}></WxParse>
                      </View>
                    </Block>
                  })}

                </View>
              </Block>}


              {/*<!-- td 类型 -->*/}
              {item.tag === 'td' && <Block>
                <View className={classNames(`${item.classStr}`, `wxParse-${item.tag}`)}>
                  {item.nodes.map((child,index) => {
                    return   <Block>
                      <View className={classNames(`${child.classStr}`, `wxParse-${child.tag}`, `wxParse-${child.tag}-container`)} style={child.styleStr}>
                        <WxParse nodes={child} />
                      </View>

                    </Block>
                  })}

                </View>
              </Block>}


              {/*<!-- audio类型 -->*/}
              {item.tag === 'audio' && <Block>
                <View className='wxParse-audio'>
                  <wxAudio
                    src='{{item.attr.src}}'
                    title='{{item.attr.title}}'
                    desc='{{item.attr.desc}}'
                    className='wxParse-audio-inner {{item.classStr}}'
                    style='{{item.styleStr}}'
                  />
                </View>
              </Block>}


              {/*<!-- br类型 -->*/}
              {item.tag === 'br' && <Block>
                <text>\n</text>
              </Block>}


              {/*<!-- 其它块级标签 -->*/}
              {item.tagType === 'block' &&  <Block>
                <View className={classNames(`${item.classStr}`, `wxParse-${item.tag}`, 'mb10')} style={item.styleStr}>
                  {item.nodes.map((child,index) => {
                    return <Block>
                      <WxParse nodes={child} />
                    </Block>
                  })}

                </View>
              </Block>}


              {/*<!-- 其它内联标签 -->*/}
              {(item.tagType !== 'block' && item.tag !== 'br' && item.tag !== 'audio' && item.tag !== 'td' && item.tag !== 'tr' && item.tag !== 'table' && item.tag !== 'a' && item.tag !== 'img' && item.tag !== 'video' && item.tag !== 'li' && item.tag !== 'ol' && item.tag !== 'ul') &&   <View className={classNames(`${item.classStr}`, `wxParse-${item.tag}`, `wxParse-${item.tagType}`)} style={item.styleStr}>
                {item.nodes.map((child,index) => {
                  return  <Block>
                    <WxParse nodes={child} />
                  </Block>
                })}
              </View> }

            </Block>}


            {/*<!-- 判断是否为文本节点 -->*/}
            {item.node === 'text' &&  <Block>
              <View className={classNames('WxEmojiView', 'wxParse-inline')} style={item.styleStr}>
                {item.textArray.map((textItem,index) => {
                  return <Block>
                    {textItem.node === 'text' &&   <Block className={classNames(`${textItem.text === '\\n' ? 'wxParse-hide':''}`)}>
                      <Text selectable>{textItem.text}</Text>
                    </Block>}
                    {textItem.node === 'element' &&   <Block>
                      <Image className='wxEmoji' src={`${textItem.baseSrc}${textItem.text}`} />
                    </Block>}

                  </Block>
                })}

              </View>
            </Block>}

          </Block>
        })}
      </Block>



    );
  }
}

export default WxParse;
