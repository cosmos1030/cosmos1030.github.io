---
layout: post
title: Reference
date: 2021-09-24
category: C++
---
# Reference

Give nickname to the variable

```cpp
#include <iostream>
using namespace std;

int main(void)
{
    int a = 1;
    int& b = a;
    cout<<b<<endl; //a의 값 출력
    return 0;
}
```



### Usage of reference

Used to operate 'pass by reference'

```c++
void switch(int& input1, int& input2)
{
    int temp = input1;
    input1 = input2;
    input2 = temp;
}
int main()
{
    int a=1, b=2;
    switch(a,b); //int& input1 = a, int& input2 = b
    cout<<a<<" "<b<<endl;
    return 0;
}
```

![C++ 기본 참조자 (Reference)](https://img1.daumcdn.net/thumb/R800x0/?scode=mtistory2&fname=https%3A%2F%2Ft1.daumcdn.net%2Fcfile%2Ftistory%2F996BDC4C5A59E1C71A)

In C language we had to use pointer to implement swap function

Pointer passes address by value to access variables in the main function.

However, Reference can directly access the memory of the variables in the main function.



### Characteristics of the Reference

```c++
int main()
{
    int& e1 = 1; //ERROR1
    int& e2 = NULL; //ERROR2
    int& e3; //ERROR3
    return 0;
}
```

ERROR1: Cannot assign value on its own

ERROR2: Cannot assign NULL value

ERROR3: Must be initialized when declared



```c++
int main()
{
    int a = 1;
    int& b = a;
    int& c = b; //CHAR1
    return 0;
}
```

CHAR1: Can be assigned to another reference



### Reason for using Reference

-to use less memory when it is used as parameter

-to pass by reference
