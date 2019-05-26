console.clear();

//ランダムな数値生成
var randint=function(min,max){
  return window.Math.floor(Math.random()*(max-min+1))+min;
};

var talk_data=[]; //会話データ

//会話クラス
var Talk=class{
  constructor(data){
    this.text=data[0]; //教師データ
    this.answer=data[1]; //ランプのセリフ
    this.text_trigram=[]; //教師データのtrigram
    this.tf_idf=[]; //tf_idf
    var i,l;

    var teaching_text=this.text+this.answer;
    this.text_array=teaching_text.split(""); //教師データの文字配列

    //教師データからtrigramへ変換
    for(i=0,l=this.text_array.length;i<l;++i){
      this.text_trigram.push([
        this.text_array[i],
        ((i+1)<l?this.text_array[i+1]:""),
        ((i+2)<l?this.text_array[i+2]:"")
      ]);
    }
  }

  getTrigram(){
    return this.text_trigram;
  }

  //単語(trigram)が存在するかどうか
  existsTrigram(array){
    for(var i=0,l=this.text_trigram.length;i<l;++i){
      if(this.text_trigram[i][0]==array[0]&&this.text_trigram[i][1]==array[1]&&this.text_trigram[i][2]==array[2]){
        return true;
      }
    }
    return false;
  }

  setTfidf(value){
    for(var i=0,l=value.length;i<l;++i){
      this.tf_idf.push(value[i]);
      //console.log(this.text_trigram[i]+":"+this.tf_idf[i]);
    }
  }

  getTfidf(index){
    return this.tf_idf[index];
  }

  getText(){
    return this.text;
  }

  getAnswer(){
    return this.answer;
  }
};

window.onload=function(){
  var i,j,k,l,l2,l3;

  //会話データ取得
  for(i=0,l=teaching_data.length;i<l;++i){
    talk_data.push(new Talk(teaching_data[i]));
  }

  //教師データに対する前処理
  for(i=0,l=talk_data.length;i<l;++i){
    var trigram=talk_data[i].getTrigram(); //trigram取得
    var tf_idf=[]; //tf-idf

    //tf-idfの取得
    for(j=0,l2=trigram.length;j<l2;++j){
      var num1=0,tf=0,num2=0,idf=0;

      //対象文書内の単語出現頻度の取得
      for(k=0,l3=trigram.length;k<l3;++k){
        if(trigram[j][0]==trigram[k][0]&&trigram[j][1]==trigram[k][1]&&trigram[j][2]==trigram[k][2]){
          num1++;
        }
      }

      //対象単語を含む文書数の取得
      for(k=0,l3=talk_data.length;k<l3;++k){
        if(talk_data[k].existsTrigram(trigram[j])){num2++;}
      }

      tf_idf[j]=(num1/trigram.length)*(Math.log(talk_data.length/num2)+1); //tf_idfの計算
    }

    //tf_idfの保存
    talk_data[i].setTfidf(tf_idf);
  }

  //console.log(teaching_data.length);
};

var talk=function(){
  var talk_table_ele=document.getElementById("talk_table"); //会話デーブル要素
  var input_data_ele=document.getElementById("input"); //入力フォーム要素
  var reg=new RegExp(/[!"#$%&'()\*\+\-\.,\/:;<=>?@\[\\\]^_`{|}~]/g);
  if(reg.test(input_data_ele.value)){return;} //半角記号が入っている場合は何もしない
  var input_data=new Talk([input_data_ele.value,""]); //入力データ
  var trigram=input_data.getTrigram(); //trigram取得
  var tf_idf=[]; //tf-idf
  var cos=[]; //コサイン類似度
  var new_talk_ele=""; //新しく追加する会話要素
  var max_index=0,max_value=0;
  var i,j,k,l,l2,l3;

  input_data_ele.value=""; //入力フォームを空にする

  //入力データのtf-idfの取得
  for(i=0,l=trigram.length;i<l;++i){
    var num1=0,tf=0,num2=1,idf=0;

    //対象文書内の単語出現頻度の取得
    for(j=0,l2=trigram.length;j<l2;++j){
      if(trigram[i][0]==trigram[j][0]&&trigram[i][1]==trigram[j][1]&&trigram[i][2]==trigram[j][2]){
        num1++;
      }
    }

    //対象単語を含む文書数の取得
    for(j=0,l2=talk_data.length;j<l2;++j){
      if(talk_data[j].existsTrigram(trigram[i])){num2++;}
    }

    //入力データのtf_idfの取得
    tf_idf[i]=(num1/trigram.length)*(Math.log((talk_data.length+1)/num2)+1);
  }

  //入力データのtf_idfの保存
  input_data.setTfidf(tf_idf);

  //教師データとのコサイン類似度計算
  for(i=0,l=talk_data.length;i<l;++i){
    var trigram2=talk_data[i].getTrigram(); //trigram取得
    cos[i]=0;
    for(j=0,l2=trigram.length;j<l2;++j){
      var flag=false;

      //同じ単語が後ろにあるかどうか確認する(あればスキップ)
      for(k=j+1,l3=trigram.length;k<l3;++k){
        if(trigram[j][0]==trigram[k][0]&&trigram[j][1]==trigram[k][1]&&trigram[j][2]==trigram[k][2]){
          flag=true;
          break;
        }
      }
      if(flag){continue;}

      //入力データと教師データが同じ単語を持っていればコサイン類似度計算
      for(k=0,l3=trigram2.length;k<l3;++k){
        if(trigram[j][0]==trigram2[k][0]&&trigram[j][1]==trigram2[k][1]&&trigram[j][2]==trigram2[k][2]){
          cos[i]+=tf_idf[j]*talk_data[i].getTfidf(k);
          break;
        }
      }
    }
  }

  //コサイン類似度が高い会話を選択
  for(i=0,l=talk_data.length;i<l;++i){
    if(cos[i]>max_value){
      max_index=i;
      max_value=cos[i];
    }
    //console.log(talk_data[i].getText()+"  : "+cos[i]);
  }

  //会話履歴テーブルに追加
  new_talk_ele+="<tr bgcolor='#FFCFCF'><td>ランプ</td><td>"+talk_data[max_index].getAnswer()+"</td></tr>";
  new_talk_ele+="<tr><td>あなた</td><td>"+input_data.getText()+"</td></tr>";
  talk_table_ele.insertAdjacentHTML("afterbegin",new_talk_ele);
};
