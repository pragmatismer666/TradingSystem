import React, { Component } from "react";
// import { connect } from "react-redux";
import {
  // CustomInput,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import { NotificationManager } from "../../components/common/react-notifications";
import IntlMessages from "../../helpers/IntlMessages";
import axios from 'axios';
import { backUrl } from "../../constants/defaultValues"

class Editparam extends Component {
  constructor(props) {
    super(props);
    this.state = {
      buyd:[],
      selld:[],
      buys:[],
      sells:[],
      take:"",
      top:"",
      bottom:"",
      balance:"",
      size:"",
      vol_size:"",
      vol:"",
      vol_count:"",
      orders:"",
      qtyrate:"",
      take3:"",
      distance:"",
      Inverse:"",
      buy_sell:"",
      pname:"",
      name:props.name,
      param:props.param,
      modal_show:props.modal_show
    };
    // this.getParam = this.getParam.bind(this);
    this.getParam();
  }

  componentDidUpdate(prevProps) {
    if (this.props.modal_data !== prevProps.modal_data) {
        this.setState({modal_data: this.props.modal_data});
    }
  }

  getParam(){
    // console.log(this.state.name,this.state.param);
    if (this.state.param !== "new"){
      axios
      .post(backUrl + '/api/get_param', {strategy:this.state.name,param:this.state.param})
      .then((result) => {
        var data = result.data[0];
        // console.log(data);
        this.setState({pname:data.name});
        if (this.state.name === "strategy1"){
          this.setState({buyd:data.buyd});
          this.setState({buys:data.buys});
          this.setState({selld:data.selld});
          this.setState({sells:data.sells});
          this.setState({take:data.take});
        }
        else if (this.state.name === "strategy2") {
          this.setState({top:data.top});
          this.setState({bottom:data.bottom});
          // this.setState({distance:data.distance});
          this.setState({balance:data.balance});
          this.setState({size:data.size});
        }
        else if (this.state.name === "strategy3") {
          this.setState({vol:data.vol});
          this.setState({vol_size:data.vol_size});
          this.setState({vol_count:data.vol_count});
          this.setState({orders:data.orders});
          this.setState({qtyrate:data.qtyrate});
          this.setState({distance:data.distance});
          this.setState({take3:data.take});
          this.setState({Inverse:data.Inverse});
          this.setState({buy_sell:data.buy_sell});
        }
      })
      .catch(err => {
        console.error(err);
      });
    }
  }

  updateParam(){
    // console.log(this.state.name,this.state.param);
    var data = {};
    data.strategy = this.state.name;
    data.param = this.state.param;
    data.name = this.state.pname;
    if (this.state.name === "strategy1"){
      data.buyd = this.state.buyd.toString().split(",");      
      data.buys = this.state.buys.toString().split(",");
      data.selld = this.state.selld.toString().split(",");
      data.sells = this.state.sells.toString().split(",");
      data.take = this.state.take;
      if (data.buyd.length !== data.selld.length || data.buys.length !== data.sells.length ){
        NotificationManager.warning("Pleas fill as correctly",this.state.name.toUpperCase() + " " + this.state.param.toUpperCase() + "Update",5000,null,"null",'');
        return ;
      }
    }
    else if (this.state.name === "strategy2"){
      data.top = this.state.top;
      data.bottom = this.state.bottom;
      data.balance = this.state.balance;
      data.size = this.state.size;
      if (data.top === 0 || data.bottom === 0 || data.balance === 0 ){
        NotificationManager.warning("Pleas fill as correctly",this.state.name.toUpperCase() + " " + this.state.param.toUpperCase() + "Update",5000,null,"null",'');
        return ;
      }
    }
    else if (this.state.name === "strategy3"){
      data.vol = this.state.vol;
      data.vol_count = this.state.vol_count;
      data.vol_size = this.state.vol_size;
      data.orders = this.state.orders;
      data.qtyrate = this.state.qtyrate;
      data.distance = this.state.distance;
      data.take = this.state.take3;
      data.Inverse = this.state.Inverse;
      data.buy_sell = this.state.buy_sell;
      // if (data.top === 0 || data.bottom === 0 || data.balance === 0 ){
      //   NotificationManager.warning("Pleas fill as correctly",this.state.name.toUpperCase() + " " + this.state.param.toUpperCase() + "Update",5000,null,"null",'');
      //   return ;
      // }
    }
    
    axios
      .post(backUrl + '/api/update_param', data)
      // .then(response => response.json())
      .then(async(result) => {
        if (result.status === 200) {
        	// console.log(this.state.name,this.state.param,"+++++++",result.data);
          NotificationManager.success(result.data.message + " successfully.",this.state.name.toUpperCase() + " " + this.state.param.toUpperCase() + "Update",5000,null,"null",'');
          await this.sleep(2000);
          this.props.toggleModal();
          // window.location.reload(false);
        }
      })
      .catch(err => {
        console.error(err);
      });
  }

  async sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  renderStrategy(){
    if (this.state.name === "strategy1"){
      return  (
        <ModalBody>
          <label className="col-md-3 param_model_text">Name</label>
          <input className="col-md-9" type="text" defaultValue={this.state.pname} onChange={event => {this.setState({ pname: event.target.value });}} />
          <label className="col-md-3 param_model_text"><IntlMessages id="param1.buyd" /></label>
          <input className="col-md-9" type="text" defaultValue={this.state.buyd} onChange={event => {this.setState({ buyd: event.target.value });}} required/>
          <label className="col-md-3 param_model_text"><IntlMessages id="param1.selld" /></label>
          <input className="col-md-9" type="text" defaultValue={this.state.selld} onChange={event => {this.setState({ selld: event.target.value });}} required/>
          <label className="col-md-3 param_model_text"><IntlMessages id="param1.buys" /></label>
          <input className="col-md-9" type="text" defaultValue={this.state.buys} onChange={event => {this.setState({ buys: event.target.value });}} required/>
          <label className="col-md-3 param_model_text"><IntlMessages id="param1.sells" /></label>
          <input className="col-md-9" type="text" defaultValue={this.state.sells} onChange={event => {this.setState({ sells: event.target.value });}} required/>
          <label className="col-md-3 param_model_text"><IntlMessages id="param.takeprofit" /></label>
          <input className="col-md-9" type="text" defaultValue={this.state.take} onChange={event => {this.setState({ take: event.target.value });}} required/>
        </ModalBody>
      )
    }
    else if (this.state.name === "strategy2") {
      return  (
        <ModalBody>
          <label className="col-md-3 param_model_text">Name</label>
          <input className="col-md-9" type="text" defaultValue={this.state.pname} onChange={event => {this.setState({ pname: event.target.value });}} />
          <label className="col-md-3 param_model_text"><IntlMessages id="param2.top" /></label>
          <input className="col-md-9" type="text" defaultValue={this.state.top} onChange={event => {this.setState({ top: event.target.value });}} />
          <label className="col-md-3 param_model_text"><IntlMessages id="param2.bottom" /></label>
          <input className="col-md-9" type="text" defaultValue={this.state.bottom} onChange={event => {this.setState({ bottom: event.target.value });}} />
          {/* <label className="col-md-3 param_model_text"><IntlMessages id="param2.d" /></label>
          <input className="col-md-9" type="text" defaultValue={this.state.distance} onChange={event => {this.setState({ distance: event.target.value });}} /> */}
          <label className="col-md-3 param_model_text"><IntlMessages id="param2.b" /></label>
          <input className="col-md-9" type="text" defaultValue={this.state.balance} onChange={event => {this.setState({ balance: event.target.value });}} />
          <label className="col-md-3 param_model_text"><IntlMessages id="param2.s" /></label>
          <input className="col-md-9" type="text" defaultValue={this.state.size} onChange={event => {this.setState({ size: event.target.value });}} />
        </ModalBody>
      )
    }
    else if (this.state.name === "strategy3") {
      return  (
        <ModalBody>
          <label className="col-md-4 param_model_text">Name</label>
          <input className="col-md-8" type="text" defaultValue={this.state.pname} onChange={event => {this.setState({ pname: event.target.value });}} />
          <label className="col-md-4 param_model_text">Volumn</label>
          <input className="col-md-8" type="text" defaultValue={this.state.vol} onChange={event => {this.setState({ vol: event.target.value });}} />
          <label className="col-md-4 param_model_text">Volumn Count</label>
          <input className="col-md-8" type="text" defaultValue={this.state.vol_count} onChange={event => {this.setState({ vol_count: event.target.value });}} />
          <label className="col-md-4 param_model_text">Volumn Bin Size</label>
          <select className="col-md-8" onChange={event => {this.setState({ vol_size: event.target.value });}}>
            <option value={this.state.vol_size} key={"now"}>{this.state.vol_size}</option>
            <option value={"1m"} key={"1m"}>1m</option>
            <option value={"5m"} key={"5m"}>5m</option>
            <option value={"1h"} key={"1h"}>1h</option>
            <option value={"1d"} key={"1d"}>1d</option>
          </select>
          <label className="col-md-4 param_model_text">Order Count</label>
          <input className="col-md-8" type="text" defaultValue={this.state.orders} onChange={event => {this.setState({ orders: event.target.value });}} />
          <label className="col-md-4 param_model_text">QTY Rate</label>
          <input className="col-md-8" type="text" defaultValue={this.state.qtyrate} onChange={event => {this.setState({ qtyrate: event.target.value });}} />
          <label className="col-md-4 param_model_text">Distance</label>
          <input className="col-md-8" type="text" defaultValue={this.state.distance} onChange={event => {this.setState({ distance: event.target.value });}} />
          <label className="col-md-4 param_model_text">Limit Profit</label>
          <input className="col-md-8" type="text" defaultValue={this.state.take3} onChange={event => {this.setState({ take3: event.target.value });}} />
          <label className="col-md-4 param_model_text">Inverse</label>
          <select className="col-md-8" onChange={event => {this.setState({ Inverse: event.target.value });}}>
            <option value={this.state.Inverse} key={"now"}>{this.state.Inverse}</option>
            <option value={"false"} key={"false"}>false</option>
            <option value={"true"} key={"true"}>true</option>
          </select>
          <label className="col-md-4 param_model_text">Buy / Sell</label>
          <select className="col-md-8" onChange={event => {this.setState({ buy_sell: event.target.value });}}>
            <option value={this.state.buy_sell} key={"now"}>{this.state.buy_sell}</option>
            <option value={"both"} key={"both"}>both</option>
            <option value={"buy"} key={"buy"}>buy</option>
            <option value={"sell"} key={"sell"}>sell</option>
          </select>
        </ModalBody>
      )
    }
  }

  render() {
    const {toggleModal} = this.props;
    return (
      <Modal
        isOpen={this.state.modal_show}
      >
        <ModalHeader className="h5">{this.state.name.toUpperCase() + "  " + this.state.param.toUpperCase()}</ModalHeader>
        {this.renderStrategy()}
        <ModalFooter>
        <Button className="w-30 m-auto" color="primary" onClick={() => this.updateParam()}><IntlMessages id="param.update" /></Button>
          <Button className="w-30 m-auto" color="secondary" outline onClick={toggleModal}>Cancel</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

export default Editparam;
// module.exports = Editparam;