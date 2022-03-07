//配置参数
const ENV = 'product';//请求方式，local本地,product接口
const clientId = 'x8gtavt39xu3fe9wye4h';//Access ID/Client ID
const clientSecret = 'e85446d335fd423d9e848d9224d7bff4';//Access Secret/Client Secret

const host = 'https://openapi.tuyacn.com';

//设备数据
const deviceList = [
  {name: '单色灯', pid: '1udophwkrulnbsbz'},
  {name: '双线调光调色控制器', pid: 'leq2ucmamlekirdk'},
  {name: '博洛尼智能双色温接收器', pid: 'fqwypt1cq8avb6bt'},
  {name: '博洛尼智能彩光接收器', pid: '8yscyykn62zzngbt'},
  {name: '未来窗', pid: '4mrvdpcwzkrvo4t4'},
  {name: '智能RGB彩灯控制器', pid: 'whlf2kqh6afth4dd'},
  {name: '智能双色灯光控制器-TW', pid: 'k1mvfu2oaaqxicqi'},
  {name: '单色灯S1300U', pid: '1udophwkrulnbsbz'},
  {name: '触点控制模式S2100-B2', pid: '1im07ez6bbqv8otb'},
  {name: '智能杀菌干燥机', pid: '9z3dcwehpianqsgr'},
];
const scheam = 'bolonismartcare';
const _timer = 1000*60*5;//定时刷新间隔5分钟

var selectedProduct = '';//默认选择设备
var common = null;
var tokenRequest = false;//是否请求token进行中，防止重复请求
var _interval;//定时刷新
var _mapType = 0;//地图请求类型
var deviceActiveSort = [];//所有设备累计激活数据

var mapScroll = false,
    deviceScroll = false;//排名是否滚动，默认false
$(function () {
  renderSelect();
  if (ENV == 'product') {
    getToken();
  }else{
    interval();
  }

  //设备列表绑定
  function renderSelect(){
    var _html = '<option value="">全部设备</option>';
    for(var i = 0;i < deviceList.length;i++){
      _html+='<option value="'+deviceList[i].pid+'">'+deviceList[i].name+'</option>';
    }
    $('#selectDevice').html(_html);
  }

  //切换设备
  $('#selectDevice').on('change',function () {
    selectedProduct = $(this).val();
    interval();
  });

  //地图渲染切换类型
  $('.map-tab').on('click','.map-tab-nav',function () {
    var index = $(this).index();
    $(this).addClass('active').siblings().removeClass('active');
    _mapType = index;
    if(_mapType==0){
      $('#map-tab-title').html('近30日激活设备');
      getDeviceActiveLocationDatas(selectedProduct);//激活设备地图分布
    }
    else{
      $('#map-tab-title').html('近30日活跃设备');
      getDeviceLiveLocationDatas(selectedProduct);//活跃设备地图分布
    }
  });

  //定时刷新
  function interval() {
    var now = new Date();
    $('#update-time').html(now.getFullYear()+'年'+(now.getMonth()+1)+'月'+now.getDate()+'日 ' + (now.getHours()<10?'0'+now.getHours():now.getHours())+':'+(now.getMinutes()<10?'0'+now.getMinutes():now.getMinutes()));
    getApps(selectedProduct);//基础概况
    getAppRegisterData('bolonismartcare','month');//app近30日注册数量
    getDeviceActiveDatas(selectedProduct);//近30日激活数量
    if(_mapType==0){
      $('#map-tab-title').html('近30日激活设备');
      getDeviceActiveLocationDatas(selectedProduct);//激活设备地图分布
    }
    else{
      $('#map-tab-title').html('近30日活跃设备');
      getDeviceLiveLocationDatas(selectedProduct);//活跃设备地图分布
    }
    getActiveDataSort();//设备累计激活排名
    // getActiveJsonDatas();//累计激活设备
    // getAppRegisterJsonDatas();//累计app注册人数
    if(_interval){
      clearInterval(_interval);
    }
    _interval = setInterval(function () {
      console.log('循环执行');
      var now = new Date();
      $('#update-time').html(now.getFullYear()+'年'+(now.getMonth()+1)+'月'+now.getDate()+'日 ' + (now.getHours()<10?'0'+now.getHours():now.getHours())+':'+(now.getMinutes()<10?'0'+now.getMinutes():now.getMinutes()));
      getApps(selectedProduct);//基础概况
      getAppRegisterData('bolonismartcare','month');//app近30日注册数量
      getDeviceActiveDatas(selectedProduct);//近30日激活数量
      if(_mapType==0){
        getDeviceActiveLocationDatas(selectedProduct);//激活设备地图分布
      }
      else{
        getDeviceLiveLocationDatas(selectedProduct);//活跃设备地图分布
      }
      getActiveDataSort();//设备累计激活排名
      // getActiveJsonDatas();//累计激活设备
      // getAppRegisterJsonDatas();//累计app注册人数
    },_timer);

  }

  //获取accessToken
  function getToken() {
    //缓存处理
    // var retJson = window.sessionStorage.getItem('common');
    // if (retJson) {
    //   common = JSON.parse(retJson);
    //   console.log(common);
    //   interval();
    //   return;
    // }
    // console.log(new Date().getTime());
    var _t = new Date().getTime();
    var hashInBase64 = sha256.hmac(clientSecret, clientId + _t).toString().toUpperCase();
    // console.log(hashInBase64);
    $.ajax({
      //请求方式
      type: "GET",
      //请求的媒体类型
      contentType: "application/json;charset=UTF-8",
      //请求地址
      url: host + "/v1.0/token?grant_type=1",
      //数据，json字符串
      data: {},
      //header
      headers: {client_id: clientId, sign: hashInBase64, sign_method: 'HMAC-SHA256', t: _t, lang: 'zh'},
      //请求成功
      success: function (result) {
        // console.log(result);
        if (result.success) {
          common = result.result;
          window.sessionStorage.setItem('common', JSON.stringify(common));
          interval();
        }
      },
      //请求失败，包含具体的错误信息
      error: function (e) {
        console.log(e.status);
        console.log(e.responseText);
      }
    })
  }
  //刷新token
  function refreshToken(){
    var _t = new Date().getTime();
    var hashInBase64 = sha256.hmac(clientSecret, clientId + _t).toString().toUpperCase();
    $.ajax({
      //请求方式
      type: "GET",
      //请求的媒体类型
      contentType: "application/json;charset=UTF-8",
      //请求地址
      url: host + "/v1.0/token/"+common.refresh_token,
      //数据，json字符串
      data: {},
      //header
      headers: {client_id: clientId, sign: hashInBase64, sign_method: 'HMAC-SHA256', t: _t, lang: 'zh'},
      //请求成功
      success: function (result) {
        // console.log(result);
        if (result.success) {
          tokenRequest = false;
          common = result.result;
          window.sessionStorage.setItem('common', JSON.stringify(common));
          interval();
        }
      },
      //请求失败，包含具体的错误信息
      error: function (e) {
        console.log(e.status);
        console.log(e.responseText);
      }
    })
  }

  /**
   * 获取数据概况
   * 包含累计注册、今日注册、累计激活、今日激活
   * */
  function getApps(productId) {
    if(ENV == 'product'){
      getRequest(host + "/v1.0/statistics-datas-survey" + (productId ? '?product_id=' + productId : ''),'GET',function (res) {
        //请求成功
        console.log('获取数据总体概况');
        console.log(res);
        var data = res.result;
        $('#today_active').html('<span style="font-size: 0.34rem;color:#33D1EC;">'+data.dev_active.today_active+'</span> 台');
        $('#totalActive').html('<span style="font-size: 0.4rem;color:#33D1EC;">'+data.dev_active.all_activate+'</span> 台');
        $('#today_app_register').html('<span style="font-size: 0.34rem;color:#33D1EC;">'+data.app_register.today_add+'</span> 人');
        $('#totalRegister').html('<span style="font-size: 0.4rem;color:#33D1EC;">'+data.app_register.all_add+'</span> 人');
        getActiveJsonDatas(data.dev_active.all_activate);//累计激活设备折线图
        getAppRegisterJsonDatas(data.app_register.all_add);//累计app注册人数折线图
      },function (res) {
        //请求失败
        console.log(res);
      });
    }
    else{
      var data = selectedProduct?localJson[selectedProduct].baseInfo:localJson['all'].baseInfo;
      $('#today_active').html('<span style="font-size: 0.34rem;color:#33D1EC;">'+data.today_active+'</span> 台');
      $('#totalActive').html('<span style="font-size: 0.4rem;color:#33D1EC;">'+data.all_activate+'</span> 台');
      $('#today_app_register').html('<span style="font-size: 0.34rem;color:#33D1EC;">'+data.today_add+'</span> 人');
      $('#totalRegister').html('<span style="font-size: 0.4rem;color:#33D1EC;">'+data.all_add+'</span> 人');
      getActiveJsonDatas();//累计激活设备折线图
      getAppRegisterJsonDatas();//累计app注册人数折线图
    }
  }

  /**
   * 获取设备统计支持类型
   * device_id 设备id
   * */
  function getDeviceType(deviceId) {
    getRequest(host + "/v1.0/devices/" + deviceId + "/all-statistic-type",'GET',function (res) {
      //请求成功
      console.log(res);
    },function (res) {
      //请求失败
      console.log(res);
    });
  }

  /**
   * 获取app 注册数据
   * schema
   * */
  function getAppRegisterData(schema,dataType) {
    if(ENV === 'product'){
      getRequest(host + "/v1.0/apps/"+schema+"/users-active-datas?date_type="+dataType,'GET',function (res) {
        //请求成功
        console.log('统计App日注册用户数');
        console.log(res);
        var data = res.result;
        if(dataType=='day'){
          // var obj = data[0];
          // var currDay = new Date();
          // currDay.setDate(currDay.getDate()-1);
          // var key = currDay.getFullYear() + '' + ((currDay.getMonth() + 1)<10?('0'+(currDay.getMonth() + 1)):currDay.getMonth() + 1) + (currDay.getDate()<10?('0'+currDay.getDate()):currDay.getDate());
          // console.log(JSON.stringify(obj) + ' ' + key);
          // $('#today_app_register').html(obj[key]+'人');
        }else if(dataType == 'month'){
          var _arr = [],
            _xArr = [];
          data.forEach(function (item) {
            _xArr.push(Object.keys(item)[0]);
            _arr.push(item[Object.keys(item)[0]]);
          });
          echarts_3(_xArr,_arr);
        }
      },function (res) {
        //请求失败
        console.log(res);
      });
    }
    else{
      var data = selectedProduct?localJson[selectedProduct].app_register_month:localJson['all'].app_register_month;
      var _arr = [],
        _xArr = [];
      data.forEach(function (item) {
        _xArr.push(Object.keys(item)[0]);
        _arr.push(item[Object.keys(item)[0]]);
      });
      echarts_3(_xArr,_arr);
    }
  }

  /**
   * 获取活跃设备地区分布数据
   * productId 商品id,不传代表全部
   * */
  function getDeviceLiveLocationDatas(productId) {
    if(ENV === 'product'){
      getRequest(host + "/v1.0/devices/locations-live-datas?date_type=month"+(productId?"&product_id="+productId:"")+"&type=city&limit=100",'GET',function (res) {
        //请求成功
        var _html = '';
        console.log('城市活跃分布排序')
        var data = res.result;
        data = data.sort(sortAsc('value'));
        data.forEach(function (item,index) {
          _html += '<li>'+(index+1)+'、'+item.name+' <span style="font-size: 0.2rem;margin-left: 0.1rem;color:#33D1EC;"> '+item.value+'</span></li>';
        })
        $('#mapSort ul').html(_html);
        scroll('mapSort');
        map(res.result);
      },function (res) {
        //请求失败
        console.log(res);
      });
    }
    else{
      var _html = '';
      console.log('城市活跃分布排序')
      var data = selectedProduct?localJson[selectedProduct].location_live_map:localJson['all'].location_live_map;
      data = data.sort(sortAsc('value'));
      console.log(data);
      data.forEach(function (item,index) {
        _html += '<li>'+(index+1)+'、'+item.name+' <span style="font-size: 0.2rem;margin-left: 0.1rem;color:#33D1EC;"> '+item.value+'</span></li>';
      })
      $('#mapSort ul').html(_html);
      scroll('mapSort');
      map(data);
    }
  }
  /**
   * 获取激活设备地区分布数据
   * productId 商品id,不传代表全部
   * */
  function getDeviceActiveLocationDatas(productId) {
    if(ENV === 'product'){
      getRequest(host + "/v1.0/devices/locations-active-datas?date_type=month"+(productId?"&product_id="+productId:"")+"&type=city&limit=100",'GET',function (res) {
        //请求成功
        var _html = '';
        console.log('城市激活分布排序')
        var data = res.result;
        data = data.sort(sortAsc('value'));
        data.forEach(function (item,index) {
          _html += '<li>'+(index+1)+'、'+item.name+' <span style="font-size: 0.2rem;margin-left: 0.1rem;color:#33D1EC;"> '+item.value+'</span></li>';
        })
        $('#mapSort ul').html(_html);
        if(mapScroll == false){
          scroll('mapSort');
        }
        map(res.result);
      },function (res) {
        //请求失败
        console.log(res);
      });
    }else{
      var _html = '';
      console.log('城市激活分布排序')
      var data = selectedProduct?localJson[selectedProduct].location_active_map:localJson['all'].location_active_map;
      data = data.sort(sortAsc('value'));
      console.log(data);
      data.forEach(function (item,index) {
        _html += '<li>'+(index+1)+'、'+item.name+' <span style="font-size: 0.2rem;margin-left: 0.1rem;color:#33D1EC;"> '+item.value+'</span></li>';
      })
      $('#mapSort ul').html(_html);
      if(mapScroll == false){
        scroll('mapSort');
      }
      map(data);
    }
  }

  /*
  * 升序
  * */
  function sortAsc(property){
    return function(a,b){
      const val1 = a[property];
      const val2 = b[property];
      return val2 - val1;
    }
  }

  /**
   * 获取设备近30日活跃数量
   * productId 商品id,不传代表全部
   * */
  function getDeviceLiveDatas(productId) {
    getRequest(host + "/v1.0/devices/live-datas?date_type=month"+(productId?"&product_id="+productId:""),'GET',function (res) {
      //请求成功
      console.log(res);
    },function (res) {
      //请求失败
      console.log(res);
    });
  }
  /**
   * 获取设备近30日激活数量
   * productId 商品id,不传代表全部
   * */
  function getDeviceActiveDatas(productId) {
    if(ENV === 'product'){
      getRequest(host + "/v1.0/devices/active-datas?date_type=month"+(productId?"&product_id="+productId:""),'GET',function (res) {
        //请求成功
        console.log(res);
        var _data = res.result;
        var _arr = [],
          _xArr = [];
        _data.forEach(function (item) {
          _xArr.push(Object.keys(item)[0]);
          _arr.push(item[Object.keys(item)[0]]);
        });
        echarts_1(_xArr,_arr);
      },function (res) {
        //请求失败
        console.log(res);
      });
    }
    else{
      var _data = selectedProduct?localJson[selectedProduct].device_active_month:localJson['all'].device_active_month;
      var _arr = [],
        _xArr = [];
      _data.forEach(function (item) {
        _xArr.push(Object.keys(item)[0]);
        _arr.push(item[Object.keys(item)[0]]);
      });
      echarts_1(_xArr,_arr);
    }
  }

  //ajax请求封装
  function getRequest(url,type,succCallback,errorCallback){
    if(tokenRequest){
      return;
    }
    var _t = new Date().getTime();
    var hashInBase64 = sha256.hmac(clientSecret, clientId + common.access_token + _t).toString().toUpperCase();
    $.ajax({
      type:type || 'POST',
      url:url,
      contentType: "application/json;charset=UTF-8",
      headers: {
        client_id: clientId,
        sign: hashInBase64,
        sign_method: 'HMAC-SHA256',
        t: _t,
        lang: 'zh',
        access_token: common.access_token
      },
      success: function (res) {
        if (res.success) {
          if(succCallback){
            succCallback(res);
          }
        }else{
          if(res.code == 1010 && res.msg == 'token is expired'){
            //token过期刷新token
            tokenRequest = true;
            refreshToken();//刷新令牌重新拉取token
            return;
          }
          else if(res.code == 1010 && res.msg == 'token invalid'){
            //token无效,重新拉取token
            tokenRequest = true;
            getToken();
            return;
          }
          if(errorCallback){
            errorCallback(res);
          }
        }
      },
      error: function (e) {
        console.log(e.status);
        console.log(e.responseText);
      }
    })
  }

  /**
   * 遍历设备激活数据
   * */
  function getActiveDataSort() {
    deviceActiveSort = [];
    console.log('遍历设备激活数据');
    if(ENV === 'product'){
      for(var i = 0;i < deviceList.length;i++){
        var name = deviceList[i].name;
        var pid = deviceList[i].pid;
        getActiveData(name,pid);
      }
    }
    else {
      var _html = '';
      var data = localJson['deviceSort'];
      data = data.sort(sortAsc('all_active'));
      data.forEach(function (item,index) {
        _html += '<li>'+(index+1)+'、'+item.name+' <span style="font-size:0.2rem;margin-left: 0.1rem;color:#33D1EC;">'+item.all_active+'</span></li>';
      })
      $('#deviceSort ul').html(_html);
      if(deviceScroll == false){
        scroll('deviceSort');
      }
    }
  }
  /**
   * 获取设备累计激活概况
   * */
  function getActiveData(deviceName,productId){
    getRequest(host + "/v1.0/devices/active-datas-survey"+(productId?"?product_id="+productId:""),'GET',function (res) {
      deviceActiveSort.push({'name':deviceName,'all_active':res.result.all_activate});
      var _html = '';
      data = deviceActiveSort.sort(sortAsc('all_active'));
      data.forEach(function (item,index) {
        _html += '<li>'+(index+1)+'、'+item.name+' <span style="font-size:0.2rem;margin-left: 0.1rem;color:#33D1EC;">'+item.all_active+'</span></li>';
      })
      $('#deviceSort ul').html(_html);
      if(deviceScroll == false && $('#deviceSort ul li').length == deviceList.length){
        scroll('deviceSort');
      }
    },function (res) {
      //请求失败
      console.log(res);
    });
  }
  /**
   * 按月份累计激活设备
   * */
  function getActiveJsonDatas(allActive){
    var _arr = [],
      _xArr = [];
    var _dataJson = selectedProduct?activeJson[selectedProduct]:activeJson['all'];
    _dataJson.forEach(function (item,index) {
      var month = Object.keys(item)[0].substring(4);
      _xArr.push(parseInt(month)+'月');
      if(allActive && index == _dataJson.length-1){
        _arr.push(allActive);
      }
      else{
        _arr.push(item[Object.keys(item)[0]]);
      }
    });
    echarts_2(_xArr,_arr);
  }
  /**
   * 按月份累计app注册设备
   * */
  function getAppRegisterJsonDatas(allAdd){
    var _arr = [],
      _xArr = [];
    appregisterJson.forEach(function (item,index) {
      var month = Object.keys(item)[0].substring(4);
      _xArr.push(parseInt(month)+'月');
      if(allAdd && index == appregisterJson.length-1){
        _arr.push(allAdd);
      }
      else{
        _arr.push(item[Object.keys(item)[0]]);
      }
    });
    echarts_4(_xArr,_arr);
  }

  function echarts_1(xData,data) {
    // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById('echarts_1'));
    option = {
      tooltip: {
        show: "true",
        trigger: 'item',
        backgroundColor: 'rgba(0,0,0,0.4)', // 背景
        padding: [8, 10], //内边距
        formatter: function (params) {
          if (params.seriesName != "") {
            return params.name + ' ：  ' + params.value + ' 台';
          }
        },
      },
      grid: {
        borderWidth: 0,
        top: 20,
        bottom: 35,
        left: 55,
        right: 30,
        textStyle: {
          color: "#fff"
        }
      },
      xAxis: [{
        type: 'category',

        axisTick: {
          show: false
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#e5e5e5',
          }
        },
        axisLabel: {
          show:false
        },
        data: xData,
      }, {
        type: 'category',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: false
        },
        splitArea: {
          show: false
        },
        splitLine: {
          show: false
        },
        data: xData,
      }],
      yAxis: {
        type: 'value',
        axisTick: {
          show: false
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#e5e5e5',
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#e5e5e5 ',
          }
        },
        axisLabel: {
          textStyle: {
            color: '#fff',
            fontWeight: 'normal',
            fontSize: '13',
          },
          formatter: '{value}',
        },
      },
      series: [
        {
          type: 'bar',
          itemStyle: {
            normal: {
              show: true,
              color: '#00c0e9',
            },
            emphasis: {
              shadowBlur: 15,
              shadowColor: 'rgba(105,123, 214, 0.7)'
            }
          },
          zlevel: 2,
          barWidth:'55%',
          data: data,
        }
      ]
    }

    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
    window.addEventListener("resize", function () {
      myChart.resize();
    });
  }

  //设备地图分布
  function map(mapData) {
    // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById('map'));

    var nameColor = " rgb(55, 75, 113)"
    var name_fontFamily = '宋体'
    var name_fontSize = 35
    var mapName = 'china'
    var data = mapData;

    var geoCoordMap = {
      '海门':[121.15,31.89],
      '鄂尔多斯':[109.781327,39.608266],
      '招远':[120.38,37.35],
      '舟山':[122.207216,29.985295],
      '齐齐哈尔':[123.97,47.33],
      '盐城':[120.13,33.38],
      '赤峰':[118.87,42.28],
      '青岛':[120.33,36.07],
      '乳山':[121.52,36.89],
      '金昌':[102.188043,38.520089],
      '泉州':[118.58,24.93],
      '莱西':[120.53,36.86],
      '日照':[119.46,35.42],
      '胶南':[119.97,35.88],
      '南通':[121.05,32.08],
      '拉萨':[91.11,29.97],
      '云浮':[112.02,22.93],
      '梅州':[116.1,24.55],
      '文登':[122.05,37.2],
      '上海':[121.48,31.22],
      '攀枝花':[101.718637,26.582347],
      '威海':[122.1,37.5],
      '承德':[117.93,40.97],
      '厦门':[118.1,24.46],
      '汕尾':[115.375279,22.786211],
      '潮州':[116.63,23.68],
      '丹东':[124.37,40.13],
      '太仓':[121.1,31.45],
      '曲靖':[103.79,25.51],
      '烟台':[121.39,37.52],
      '福州':[119.3,26.08],
      '瓦房店':[121.979603,39.627114],
      '即墨':[120.45,36.38],
      '抚顺':[123.97,41.97],
      '玉溪':[102.52,24.35],
      '张家口':[114.87,40.82],
      '阳泉':[113.57,37.85],
      '莱州':[119.942327,37.177017],
      '湖州':[120.1,30.86],
      '汕头':[116.69,23.39],
      '昆山':[120.95,31.39],
      '宁波':[121.56,29.86],
      '湛江':[110.359377,21.270708],
      '揭阳':[116.35,23.55],
      '荣成':[122.41,37.16],
      '连云港':[119.16,34.59],
      '葫芦岛':[120.836932,40.711052],
      '常熟':[120.74,31.64],
      '东莞':[113.75,23.04],
      '河源':[114.68,23.73],
      '淮安':[119.15,33.5],
      '泰州':[119.9,32.49],
      '南宁':[108.33,22.84],
      '营口':[122.18,40.65],
      '惠州':[114.4,23.09],
      '江阴':[120.26,31.91],
      '蓬莱':[120.75,37.8],
      '韶关':[113.62,24.84],
      '嘉峪关':[98.289152,39.77313],
      '广州':[113.23,23.16],
      '延安':[109.47,36.6],
      '太原':[112.53,37.87],
      '清远':[113.01,23.7],
      '中山':[113.38,22.52],
      '昆明':[102.73,25.04],
      '寿光':[118.73,36.86],
      '盘锦':[122.070714,41.119997],
      '长治':[113.08,36.18],
      '深圳':[114.07,22.62],
      '珠海':[113.52,22.3],
      '宿迁':[118.3,33.96],
      '咸阳':[108.72,34.36],
      '铜川':[109.11,35.09],
      '平度':[119.97,36.77],
      '佛山':[113.11,23.05],
      '海口':[110.35,20.02],
      '江门':[113.06,22.61],
      '章丘':[117.53,36.72],
      '肇庆':[112.44,23.05],
      '大连':[121.62,38.92],
      '临汾':[111.5,36.08],
      '吴江':[120.63,31.16],
      '石嘴山':[106.39,39.04],
      '沈阳':[123.38,41.8],
      '苏州':[120.62,31.32],
      '茂名':[110.88,21.68],
      '嘉兴':[120.76,30.77],
      '长春':[125.35,43.88],
      '胶州':[120.03336,36.264622],
      '银川':[106.27,38.47],
      '张家港':[120.555821,31.875428],
      '三门峡':[111.19,34.76],
      '锦州':[121.15,41.13],
      '南昌':[115.89,28.68],
      '柳州':[109.4,24.33],
      '三亚':[109.511909,18.252847],
      '自贡':[104.778442,29.33903],
      '吉林':[126.57,43.87],
      '阳江':[111.95,21.85],
      '泸州':[105.39,28.91],
      '西宁':[101.74,36.56],
      '宜宾':[104.56,29.77],
      '呼和浩特':[111.65,40.82],
      '成都':[104.06,30.67],
      '大同':[113.3,40.12],
      '镇江':[119.44,32.2],
      '桂林':[110.28,25.29],
      '张家界':[110.479191,29.117096],
      '宜兴':[119.82,31.36],
      '北海':[109.12,21.49],
      '西安':[108.95,34.27],
      '金坛':[119.56,31.74],
      '东营':[118.49,37.46],
      '牡丹江':[129.58,44.6],
      '遵义':[106.9,27.7],
      '绍兴':[120.58,30.01],
      '扬州':[119.42,32.39],
      '常州':[119.95,31.79],
      '潍坊':[119.1,36.62],
      '重庆':[106.54,29.59],
      '台州':[121.420757,28.656386],
      '南京':[118.78,32.04],
      '滨州':[118.03,37.36],
      '贵阳':[106.71,26.57],
      '无锡':[120.29,31.59],
      '本溪':[123.73,41.3],
      '克拉玛依':[84.77,45.59],
      '渭南':[109.5,34.52],
      '马鞍山':[118.48,31.56],
      '宝鸡':[107.15,34.38],
      '焦作':[113.21,35.24],
      '句容':[119.16,31.95],
      '北京':[116.46,39.92],
      '徐州':[117.2,34.26],
      '衡水':[115.72,37.72],
      '包头':[110,40.58],
      '绵阳':[104.73,31.48],
      '乌鲁木齐':[87.68,43.77],
      '枣庄':[117.57,34.86],
      '杭州':[120.19,30.26],
      '淄博':[118.05,36.78],
      '鞍山':[122.85,41.12],
      '溧阳':[119.48,31.43],
      '库尔勒':[86.06,41.68],
      '安阳':[114.35,36.1],
      '开封':[114.35,34.79],
      '济南':[117,36.65],
      '德阳':[104.37,31.13],
      '温州':[120.65,28.01],
      '九江':[115.97,29.71],
      '邯郸':[114.47,36.6],
      '临安':[119.72,30.23],
      '兰州':[103.73,36.03],
      '沧州':[116.83,38.33],
      '临沂':[118.35,35.05],
      '南充':[106.110698,30.837793],
      '天津':[117.2,39.13],
      '富阳':[119.95,30.07],
      '泰安':[117.13,36.18],
      '诸暨':[120.23,29.71],
      '郑州':[113.65,34.76],
      '哈尔滨':[126.63,45.75],
      '聊城':[115.97,36.45],
      '芜湖':[118.38,31.33],
      '唐山':[118.02,39.63],
      '平顶山':[113.29,33.75],
      '邢台':[114.48,37.05],
      '德州':[116.29,37.45],
      '济宁':[116.59,35.38],
      '荆州':[112.239741,30.335165],
      '宜昌':[111.3,30.7],
      '义乌':[120.06,29.32],
      '丽水':[119.92,28.45],
      '洛阳':[112.44,34.7],
      '秦皇岛':[119.57,39.95],
      '株洲':[113.16,27.83],
      '石家庄':[114.48,38.03],
      '莱芜':[117.67,36.19],
      '常德':[111.69,29.05],
      '保定':[115.48,38.85],
      '湘潭':[112.91,27.87],
      '金华':[119.64,29.12],
      '岳阳':[113.09,29.37],
      '长沙':[113,28.21],
      '衢州':[118.88,28.97],
      '廊坊':[116.7,39.53],
      '菏泽':[115.480656,35.23375],
      '合肥':[117.27,31.86],
      '武汉':[114.31,30.52],
      '大庆':[125.03,46.58]
    };

    var convertData = function (data) {
      var res = [];
      for (var i = 0; i < data.length; i++) {
        var geoCoord = cityJson[data[i].name];
        if (geoCoord) {
          res.push({
            name: data[i].name,
            value: geoCoord.concat(data[i].value),
          });
        }
      }
      return res;
    };
    console.log('--------map----------');

    option = {
      backgroundColor: 'transparent',
      tooltip : {
        trigger: 'item',
          formatter: function (params) {
            if(typeof(params.value)[2] == "undefined"){
              return params.name + ' : ' + params.value;
            }else{
              return params.name + ' : ' + params.value[2];
            }
          }
      },
      geo: {
        map: 'china',
          label: {
          emphasis: {
            show: false
          }
        },
        roam: true,//禁止其放大缩小
        scaleLimit:{
        	 min:0.5,//缩放最小限制
        },
        itemStyle: {
          normal: {
            areaColor: '#2258a4',
            borderColor: '#5cc7dc'
          },
          emphasis: {
            areaColor: '#4472b4'
          }
        }
      },
      series: [
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          data: convertData(data),
          encode: {
            value: 2
          },
          symbolSize: function (val) {
            return Math.round(Math.random() * (20 - 8)) + 8;
          },
          label: {
            formatter: '{b}',
            position: 'right'
          },
          itemStyle: {
            color: '#ddb926',
            shadowBlur: 10,
            shadowColor: '#333'
          },
          emphasis: {
            label: {
              show: true
            }
          }
        },
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: convertData(data).length>10?convertData(data.sort(function (a, b) {
            return b.value - a.value;
          }).slice(0, 6)):[],
          encode: {
            value: 2
          },
          symbolSize: function (val) {
            return Math.round(Math.random() * (26 - 21)) + 21;
          },
          showEffectOn: 'emphasis',
          rippleEffect: {
            brushType: 'stroke'
          },
          hoverAnimation: true,
          label: {
            formatter: '{b}',
            position: 'right',
            show: true
          },
          itemStyle: {
            color: '#f4e925',
            shadowBlur: 10,
            shadowColor: '#333'
          },
          emphasis: {
            label: {
              show: true
            }
          },
          zlevel: 1
        },

      ]
    };

    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
    window.addEventListener("resize", function () {
      myChart.resize();
    });
  }

  function echarts_2(xData,data) {
    // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById('echarts_2'));

    option = {

      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '3%',
        top: '8%',
        bottom: '5%',
        containLabel: true
      },
      color: ['rgba(112,37,67,0.7)'],

      calculable: true,
      xAxis: [
        {
          type: 'category',

          axisTick: {show: false},

          boundaryGap: false,
          axisLabel: {
            textStyle: {
              color: '#fff',
              fontSize: '13'
            },
            lineStyle: {
              color: '#2c3459',
            },
            interval: {default: 0},
            rotate: 50,
          },
          data: xData
        }
      ],
      yAxis: {

        type: 'value',
        axisLabel: {
          textStyle: {
            color: '#fff',
            fontSize: '13',
          }
        },
        axisLine: {
          show:false,
          lineStyle: {
            color: '#e5e5e5',
          }
        },
        splitLine: {
          lineStyle: {
            color: '#e5e5e5',
          }
        },

      }
      ,
      series: [
        {
          type: 'line',
          areaStyle: {

            normal: {
              type: 'default',
              color: new echarts.graphic.LinearGradient(0, 0, 0, 0.8, [{
                offset: 0,
                color: '#702543'
              }, {
                offset: 1,
                color: '#702543'
              }], false)
            }
          },
          smooth: false,
          itemStyle: {
            normal: {areaStyle: {type: 'default'}}
          },
          data: data
        }
      ]
    };

    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
    window.addEventListener("resize", function () {
      myChart.resize();
    });
  }

  function echarts_3(xData,data) {
    // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById('echarts_3'));

    option = {
      tooltip: {
        show: "true",
        trigger: 'item',
        backgroundColor: 'rgba(0,0,0,0.4)', // 背景
        padding: [8, 10], //内边距
        formatter: function (params) {
          if (params.seriesName != "") {
            return params.name + ' ：  ' + params.value + ' 人';
          }
        },
      },
      grid: {
        borderWidth: 0,
        top: 20,
        bottom: 35,
        left: 55,
        right: 30,
        textStyle: {
          color: "#fff"
        }
      },
      xAxis: [{
        type: 'category',

        axisTick: {
          show: false
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#e5e5e5',
          }
        },
        axisLabel: {
          show:false
        },
        data: xData,
      }, {
        type: 'category',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: false
        },
        splitArea: {
          show: false
        },
        splitLine: {
          show: false
        },
        data: xData,
      }],
      yAxis: {
        type: 'value',
        axisTick: {
          show: false
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#e5e5e5',
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#e5e5e5 ',
          }
        },
        axisLabel: {
          textStyle: {
            color: '#fff',
            fontWeight: 'normal',
            fontSize: '13',
          },
          formatter: '{value}',
        },
      },
      series: [
        {
          type: 'bar',
          itemStyle: {
            normal: {
              show: true,
              color: '#00c0e9',
            },
            emphasis: {
              shadowBlur: 15,
              shadowColor: 'rgba(105,123, 214, 0.7)'
            }
          },
          zlevel: 2,
          barWidth:'55%',
          data: data,
        }
      ]
    }


    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
    window.addEventListener("resize", function () {
      myChart.resize();
    });
  }

  function echarts_4(xData,data) {
    // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById('echarts_4'));

    option = {
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '3%',
        top: '8%',
        bottom: '5%',
        containLabel: true
      },
      color: ['rgba(112,37,67,0.7)'],

      calculable: true,
      xAxis: [
        {
          type: 'category',
          axisTick: {show: false},
          axisLabel: {
            textStyle: {
              color: '#fff',
              fontSize: '13'
            },
            lineStyle: {
              color: '#2c3459',
            },
            interval: {default: 0},
            rotate: 50,
          },
          data: xData
        }
      ],
      yAxis: {

        type: 'value',
        axisLabel: {
          textStyle: {
            color: '#fff',
            fontSize: '13',
          }
        },
        axisLine: {
          show:false,
          lineStyle: {
            color: '#e5e5e5',
          }
        },
        splitLine: {
          lineStyle: {
            color: '#e5e5e5',
          }
        },

      }
      ,
      series: [
        {
          // name:'简易程序案件数',
          type: 'line',
          areaStyle: {

            normal: {
              type: 'default',
              color: new echarts.graphic.LinearGradient(0, 0, 0, 0.7, [{
                offset: 0,
                color: '#702543'
              }, {
                offset: 1,
                color: '#702543'
              }], false)
            }
          },
          smooth: false,
          itemStyle: {
            normal: {areaStyle: {type: 'default'}}
          },
          data: data
        }
      ]
    };

    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
    window.addEventListener("resize", function () {
      myChart.resize();
    });
  }

  function scroll(dom) {
    if(dom === 'mapSort'){
      if(mapScroll)
        return;
      else
        mapScroll = true;
    }
    if(dom === 'deviceSort'){
      if(deviceScroll)
        return;
      else
        deviceScroll = true;
    }
    console.log(dom);
    var num=$("#"+dom).find("li").length;
    var stop = false;
    if (num>1) {
      var timerID = setInterval(function(){
        if(stop == true || $("#"+dom).find("li").length<6){
          return;
        }
        $('#'+dom).find('ul').animate({
          marginTop:0 - $("#"+dom).find("li:first").height()+'px'
        },500,function(){
          $('#'+dom).find('ul').css({marginTop : "0"}).find("li:first").appendTo(this);
        });
      }, 3000);
      $('#'+dom).hover(function () {
        $(this).css({'cursor':'pointer','overflow-y':'scroll'});
        stop = true;
      },function () {
        $(this).css({'cursor':'pointer','overflow-y':'hidden'});
        stop = false;
      });
    }
  }

  var whei = $(window).width()
  $("html").css({fontSize: whei / 1920*100})
  $(window).resize(function () {
    var whei = $(window).width()
    $("html").css({fontSize: whei / 1920*100})
  });
})

