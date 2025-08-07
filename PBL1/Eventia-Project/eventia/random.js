var maxProfit = function(prices) {
    let maxPrices=Math.max(...(prices.slice(1)))
    let maxIndex=prices.indexOf(maxPrices)
    let Profit=[]
    let i=0
     while(i<prices.length-1){
           if(prices[i]>prices[i+1] && i!=maxIndex){ //[7,1,5,3,6,4]
            i++;
            continue;
           }else if(i<maxIndex){
               Profit.push(prices[maxIndex]-prices[i]);
               i++;
           }else{
               if(prices[i]<prices[i+1]){
                Profit.push(prices[i+1]-prices[i])
                i++
               }else{
                i++;
               }
           }
     }
     let max=Math.max(...Profit)
    return max;
};

console.log(maxProfit([7,1,5,3,6,4]));