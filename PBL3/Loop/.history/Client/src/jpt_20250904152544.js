var reverseVowels = function(s) {
    d
    let arr =[];
    let vowels ='AEIOUaeiou';
    for( let char of s){
        if(vowels.includes(char)){
            arr.push[char];
        }
    }
    arr=arr.reverse();
    let res=[];
    let m=0;
    for (let ch of s){
        if(vowels.includes(ch)){
            res.push[arr[m]];
            m++
        }
        else {
            res.push[ch]
        }
    }
    return res.join('')
};

console.log(reverseVowels("IceCreAm"))